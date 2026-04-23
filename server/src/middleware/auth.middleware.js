import crypto from "node:crypto";
import { verifyDoctorToken } from "../utils/doctorAuthToken.js";

const parseBearerToken = (authorizationHeader) => {
  const value = String(authorizationHeader || "").trim();
  if (!value.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return value.slice(7).trim();
};

const safeEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const requireDoctorAuth = (req, res, next) => {
  const token = parseBearerToken(req.headers.authorization);
  const result = verifyDoctorToken(token);

  if (!result.valid) {
    return res.status(401).json({ message: result.reason || "Unauthorized" });
  }

  req.doctor = result.payload;
  next();
};

export const requireSensorIngestSecret = (req, res, next) => {
  const expected = String(process.env.SENSOR_INGEST_SECRET || "").trim();
  if (!expected) {
    return res.status(500).json({ message: "Sensor ingest auth is not configured on server" });
  }

  const provided = String(req.headers["x-sensor-secret"] || "").trim();
  if (!provided || !safeEquals(provided, expected)) {
    return res.status(401).json({ message: "Unauthorized sensor ingest request" });
  }

  next();
};

export { parseBearerToken, safeEquals };
