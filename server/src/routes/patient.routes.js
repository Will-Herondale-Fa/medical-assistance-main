import express from "express";
import {
  createPatient,
  getLatestPatient,
  getLatestPatientPdf,
  printLatestPatient,
} from "../controllers/patient.controller.js";
import { requireDoctorAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", requireDoctorAuth, createPatient);
router.get("/latest", getLatestPatient);
router.get("/latest/pdf", getLatestPatientPdf);
router.post("/latest/print", requireDoctorAuth, printLatestPatient);

export default router;
