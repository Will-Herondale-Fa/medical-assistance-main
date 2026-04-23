import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { validateRequiredEnv } from "./src/config/env.js";
import { getSocketCorsOptions } from "./src/config/cors.js";
import { startPrescriptionCleanupJob } from "./src/jobs/prescriptionCleanup.job.js";
import { parseBearerToken, safeEquals } from "./src/middleware/auth.middleware.js";
import { getLatestLedCommandSnapshot } from "./src/controllers/led.controller.js";
import { verifyDoctorToken } from "./src/utils/doctorAuthToken.js";
import {
  clearConsultationSession,
  getConsultationSession,
  setConsultationSession,
} from "./src/utils/consultationSession.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envResult = dotenv.config({
  path: path.resolve(__dirname, ".env"),
  override: true,
  quiet: true,
});
if (envResult.error) {
  dotenv.config({
    path: path.resolve(__dirname, "../.env"),
    override: true,
    quiet: true,
  });
}

try {
  validateRequiredEnv();
} catch (error) {
  console.error(`[startup] ${error.message}`);
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: getSocketCorsOptions(),
});
app.set("io", io);
const wsClients = new Set();
app.set("wsClients", wsClients);

const wss = new WebSocketServer({ noServer: true });
wss.on("connection", (ws) => {
  wsClients.add(ws);
  console.log("Raw WebSocket client connected");

  ws.send(JSON.stringify({
    type: "connected",
    message: "WebSocket connected",
    ts: new Date().toISOString(),
  }));
  ws.send(JSON.stringify({
    type: "ledCommand",
    ...getLatestLedCommandSnapshot(),
  }));

  ws.on("close", () => {
    wsClients.delete(ws);
    console.log("Raw WebSocket client disconnected");
  });

  ws.on("error", () => {
    wsClients.delete(ws);
  });
});

// Keep raw websocket connections alive behind proxies/load balancers.
setInterval(() => {
  const heartbeat = JSON.stringify({
    type: "heartbeat",
    ts: new Date().toISOString(),
  });

  wsClients.forEach((client) => {
    try {
      if (client && client.readyState === 1) {
        client.send(heartbeat);
      } else {
        wsClients.delete(client);
      }
    } catch {
      wsClients.delete(client);
    }
  });
}, 20000);

server.on("upgrade", (request, socket, head) => {
  const requestUrl = request.url || "";

  // Raw ws endpoint for ESP devices
  if (requestUrl === "/ws" || requestUrl.startsWith("/ws?") || requestUrl.startsWith("/ws/")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
    return;
  }

  // Let Socket.IO handle its own websocket upgrades (/socket.io/...)
  if (requestUrl.startsWith("/socket.io/")) {
    return;
  }

  // Reject unknown upgrade paths
  if (!socket.destroyed) {
    socket.destroy();
  }
});
const printAgents = new Map();

const ROLES = {
  patient: "patient",
  doctor: "doctor",
  printAgent: "print-agent",
};

const ROLE_ROOMS = {
  [ROLES.patient]: "role:patient",
  [ROLES.doctor]: "role:doctor",
  [ROLES.printAgent]: "role:print-agent",
};

const emitToPatientsAndDoctors = (eventName, payload) => {
  io.to(ROLE_ROOMS[ROLES.patient]).emit(eventName, payload);
  io.to(ROLE_ROOMS[ROLES.doctor]).emit(eventName, payload);
};

const emitToDoctors = (eventName, payload) => {
  io.to(ROLE_ROOMS[ROLES.doctor]).emit(eventName, payload);
};

const emitToPrintAgents = (eventName, payload) => {
  io.to(ROLE_ROOMS[ROLES.printAgent]).emit(eventName, payload);
};

const getSocketRole = (socket) => socket.data?.role || ROLES.patient;

const isDoctorSocket = (socket) => getSocketRole(socket) === ROLES.doctor;

const isPrintAgentSocket = (socket) => getSocketRole(socket) === ROLES.printAgent;

const getPrintAgentStatusPayload = () => {
  const onlineAgents = Array.from(printAgents.values());
  return {
    online: onlineAgents.length > 0,
    count: onlineAgents.length,
    agents: onlineAgents,
  };
};

const emitPrintAgentStatus = () => {
  emitToDoctors("printAgentStatusUpdated", getPrintAgentStatusPayload());
};

io.use((socket, next) => {
  const requestedRole = String(socket.handshake.auth?.role || ROLES.patient).toLowerCase();

  if (requestedRole === ROLES.doctor) {
    const headerToken = parseBearerToken(socket.handshake.headers?.authorization);
    const authToken = String(socket.handshake.auth?.token || "").trim();
    const token = authToken || headerToken;
    const result = verifyDoctorToken(token);
    if (!result.valid) {
      next(new Error("unauthorized doctor socket"));
      return;
    }
    socket.data.role = ROLES.doctor;
    socket.data.doctor = result.payload;
    next();
    return;
  }

  if (requestedRole === ROLES.printAgent) {
    const expectedSecret = String(process.env.PRINT_AGENT_SECRET || "").trim();
    const providedSecret = String(socket.handshake.auth?.agentSecret || "").trim();

    if (!expectedSecret) {
      next(new Error("print agent auth is not configured on server"));
      return;
    }

    if (!providedSecret || !safeEquals(providedSecret, expectedSecret)) {
      next(new Error("unauthorized print agent socket"));
      return;
    }

    socket.data.role = ROLES.printAgent;
    next();
    return;
  }

  socket.data.role = ROLES.patient;
  next();
});

io.on("connection", (socket) => {
  const role = getSocketRole(socket);
  socket.join(ROLE_ROOMS[role]);
  console.log(`Socket connected: ${socket.id} (${role})`);

  const activeConsultation = getConsultationSession();
  if (activeConsultation) {
    socket.emit("consultationLinkUpdated", activeConsultation);
  }
  if (isDoctorSocket(socket)) {
    socket.emit("printAgentStatusUpdated", getPrintAgentStatusPayload());
  }

  socket.on("prescriptionCreated", (data) => {
    if (!isDoctorSocket(socket)) {
      return;
    }

    emitToPatientsAndDoctors("prescriptionCreated", data);
  });

  socket.on("printLatestPrescription", (data) => {
    if (!isDoctorSocket(socket)) {
      return;
    }

    emitToPrintAgents("printLatestPrescription", data);
  });

  socket.on("updateConsultationLink", (data) => {
    if (!isDoctorSocket(socket)) {
      return;
    }

    try {
      const nextConsultation = setConsultationSession({
        ...(data || {}),
        doctorName: String(data?.doctorName || "").trim() || socket.data?.doctor?.email || "",
      });
      emitToPatientsAndDoctors("consultationLinkUpdated", nextConsultation);
    } catch (error) {
      socket.emit("consultationLinkError", {
        message: error?.message || "Invalid consultation link",
      });
    }
  });

  socket.on("clearConsultationLink", () => {
    if (!isDoctorSocket(socket)) {
      return;
    }

    clearConsultationSession();
    emitToPatientsAndDoctors("consultationLinkUpdated", null);
  });

  socket.on("printAgentOnline", (data) => {
    if (!isPrintAgentSocket(socket)) {
      return;
    }

    printAgents.set(socket.id, {
      socketId: socket.id,
      machineName: data?.machineName || "Unknown machine",
      printerName: data?.printerName || "Default printer",
      lastSeenAt: new Date().toISOString(),
    });
    emitPrintAgentStatus();
  });

  socket.on("printAgentHeartbeat", (data) => {
    if (!isPrintAgentSocket(socket)) {
      return;
    }

    const current = printAgents.get(socket.id);
    if (!current) {
      printAgents.set(socket.id, {
        socketId: socket.id,
        machineName: data?.machineName || "Unknown machine",
        printerName: data?.printerName || "Default printer",
        lastSeenAt: new Date().toISOString(),
      });
    } else {
      current.lastSeenAt = new Date().toISOString();
      if (data?.printerName) {
        current.printerName = data.printerName;
      }
      if (data?.machineName) {
        current.machineName = data.machineName;
      }
    }
    emitPrintAgentStatus();
  });

  socket.on("disconnect", () => {
    if (printAgents.has(socket.id)) {
      printAgents.delete(socket.id);
      emitPrintAgentStatus();
    }
    console.log(`Socket disconnected: ${socket.id} (${role})`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  startPrescriptionCleanupJob();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing process or change PORT in server/.env`);
  } else {
    console.error("Server startup failed:", error.message);
  }
  process.exit(1);
});

startServer();
