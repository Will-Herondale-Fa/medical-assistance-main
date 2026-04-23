import express from "express";
import {
  clearActiveConsultation,
  getActiveConsultation,
  upsertActiveConsultation,
} from "../controllers/consultation.controller.js";
import { requireDoctorAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getActiveConsultation);
router.put("/", requireDoctorAuth, upsertActiveConsultation);
router.delete("/", requireDoctorAuth, clearActiveConsultation);

export default router;
