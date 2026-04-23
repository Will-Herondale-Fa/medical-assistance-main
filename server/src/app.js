import express from "express";
import cors from "cors";

import patientRoutes from "./routes/patient.routes.js";
import sensorRoutes from "./routes/sensor.routes.js";
import ledRoutes from "./routes/led.routes.js";
import authRoutes from "./routes/auth.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import { getExpressCorsOptions } from "./config/cors.js";

const app = express();

app.use(cors(getExpressCorsOptions()));
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "medical-assistance-api",
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

export default app;
