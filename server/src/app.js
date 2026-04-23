import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import patientRoutes from "./routes/patient.routes.js";
import sensorRoutes from "./routes/sensor.routes.js";
import ledRoutes from "./routes/led.routes.js";
import authRoutes from "./routes/auth.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import { getExpressCorsOptions } from "./config/cors.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistDir = path.resolve(__dirname, "../../dist");
const frontendIndexPath = path.join(frontendDistDir, "index.html");
const hasBuiltFrontend = fs.existsSync(frontendIndexPath);

app.use(cors(getExpressCorsOptions()));
app.use(express.json());

app.get("/", (_req, res) => {
  if (hasBuiltFrontend) {
    return res.sendFile(frontendIndexPath);
  }

  res.status(200).json({
    ok: true,
    service: "medibot-api",
    message: "API is running",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "Server is healthy" });
});

app.use("/api/patients", patientRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/led-command", ledRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/consultation", consultationRoutes);

if (hasBuiltFrontend) {
  app.use(express.static(frontendDistDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

export default app;
