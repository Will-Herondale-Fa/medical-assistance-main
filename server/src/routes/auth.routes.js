import express from "express";
import { doctorLogin, verifyDoctorSession } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/doctor-login", doctorLogin);
router.get("/verify-doctor", verifyDoctorSession);

export default router;
