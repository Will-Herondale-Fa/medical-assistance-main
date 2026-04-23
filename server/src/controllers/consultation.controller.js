import {
  clearConsultationSession,
  getConsultationSession,
  setConsultationSession,
} from "../utils/consultationSession.js";

const emitConsultationUpdate = (req, payload) => {
  const io = req.app.get("io");
  if (!io) {
    return;
  }

  io.to("role:patient").emit("consultationLinkUpdated", payload);
  io.to("role:doctor").emit("consultationLinkUpdated", payload);
};

export const getActiveConsultation = (_req, res) => {
  const session = getConsultationSession();
  if (!session) {
    return res.status(404).json({ message: "No active consultation session" });
  }

  return res.status(200).json(session);
};

export const upsertActiveConsultation = (req, res) => {
  try {
    const doctorEmail = String(req.doctor?.email || "").trim();
    const nextSession = setConsultationSession({
      ...(req.body || {}),
      doctorName: String(req.body?.doctorName || "").trim() || doctorEmail,
    });

    emitConsultationUpdate(req, nextSession);
    return res.status(200).json(nextSession);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Invalid consultation payload" });
  }
};

export const clearActiveConsultation = (req, res) => {
  clearConsultationSession();
  emitConsultationUpdate(req, null);
  return res.status(200).json({ ok: true });
};
