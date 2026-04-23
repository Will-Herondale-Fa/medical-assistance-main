import { createDoctorToken, verifyDoctorToken } from "../utils/doctorAuthToken.js";

const getDoctorCredentials = () => {
  const email = String(process.env.DOCTOR_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.DOCTOR_PASSWORD || "").trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

export const doctorLogin = (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "").trim();

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const creds = getDoctorCredentials();
  if (!creds) {
    return res.status(500).json({ message: "Doctor login is not configured on server" });
  }
  if (email !== creds.email || password !== creds.password) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  let token;
  try {
    token = createDoctorToken({ email });
  } catch {
    return res.status(500).json({ message: "Doctor auth token is not configured on server" });
  }

  return res.status(200).json({
    token,
    doctor: { email },
  });
};

export const verifyDoctorSession = (req, res) => {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const result = verifyDoctorToken(token);

  if (!result.valid) {
    return res.status(401).json({ valid: false, message: result.reason });
  }

  return res.status(200).json({
    valid: true,
    doctor: { email: result.payload.email, role: result.payload.role },
  });
};
