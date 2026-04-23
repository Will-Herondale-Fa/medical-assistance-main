import express from "express";
import { getLatestLedCommand, setLedCommand } from "../controllers/led.controller.js";
import { requireDoctorAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/latest", getLatestLedCommand);
router.post("/", requireDoctorAuth, setLedCommand);

export default router;
