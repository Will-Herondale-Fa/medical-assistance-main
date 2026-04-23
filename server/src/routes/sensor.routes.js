import express from "express";
import { getLatestSensorData, saveSensorData } from "../controllers/sensor.controller.js";
import { requireSensorIngestSecret } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/latest", getLatestSensorData);
router.post("/", requireSensorIngestSecret, saveSensorData);

export default router;
