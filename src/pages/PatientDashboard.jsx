import { useEffect, useState } from "react";
import "../styles/PatientDashboard.css";
import { Link } from "react-router-dom";
import api from "../api/axios";
import socket from "../socket/socket";
import {
  canUseInAppJitsiEmbed,
  inferConsultationPlatform,
  platformLabel,
} from "../utils/consultation";

const CONSULTATION_STORAGE_KEY = "medibot:lastConsultationSession";
const LEGACY_CONSULTATION_LINK_KEY = "medibot:lastConsultationLink";

const readStoredConsultationSession = () => {
  try {
    const raw = localStorage.getItem(CONSULTATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.meetingLink === "string" && parsed.meetingLink.trim()) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed local storage payload.
  }

  const legacyLink = String(localStorage.getItem(LEGACY_CONSULTATION_LINK_KEY) || "").trim();
  if (!legacyLink) {
    return null;
  }

  return {
    meetingLink: legacyLink,
    platform: inferConsultationPlatform(legacyLink),
    openMode: "external",
  };
};

const persistConsultationSession = (session) => {
  if (!session?.meetingLink) {
    localStorage.removeItem(CONSULTATION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CONSULTATION_LINK_KEY);
    return;
  }

  localStorage.setItem(CONSULTATION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_CONSULTATION_LINK_KEY, session.meetingLink);
};

const getEmbeddedJitsiUrl = (meetingLink) => {
  if (!meetingLink) {
    return "";
  }
  const separator = meetingLink.includes("#") ? "&" : "#";
  return `${meetingLink}${separator}config.prejoinPageEnabled=false&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true`;
};

const PatientDashboard = () => {
  const [, setPatientDetails] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [consultationSession, setConsultationSession] = useState(readStoredConsultationSession);
  const [isEmbeddedCallVisible, setIsEmbeddedCallVisible] = useState(false);

  const consultationLink = consultationSession?.meetingLink || "";
  const consultationPlatform = platformLabel(
    consultationSession?.platform || inferConsultationPlatform(consultationLink)
  );
  const isJitsiEmbeddedMode =
    consultationSession?.platform === "jitsi" &&
    consultationSession?.openMode === "in-app" &&
    canUseInAppJitsiEmbed(consultationLink);
  const embeddedJitsiUrl = isJitsiEmbeddedMode
    ? getEmbeddedJitsiUrl(consultationLink)
    : "";

  useEffect(() => {
    let mounted = true;
    let latestObjectUrl = null;

    const applyConsultationSession = (session) => {
      if (!mounted) {
        return;
      }

      if (!session?.meetingLink) {
        setConsultationSession(null);
        setIsEmbeddedCallVisible(false);
        persistConsultationSession(null);
        return;
      }

      const normalizedPlatform =
        session.platform || inferConsultationPlatform(session.meetingLink);

      const normalized = {
        ...session,
        platform: normalizedPlatform,
        openMode:
          normalizedPlatform === "jitsi" && session.openMode === "in-app"
            ? "in-app"
            : "external",
      };

      setConsultationSession(normalized);
      persistConsultationSession(normalized);
    };

    const loadLatestPdf = async () => {
      try {
        setIsPdfLoading(true);
        const res = await api.get("/patients/latest/pdf", { responseType: "blob" });
        if (!mounted) return;

        if (latestObjectUrl) {
          URL.revokeObjectURL(latestObjectUrl);
        }
        latestObjectUrl = URL.createObjectURL(res.data);
        setPdfUrl(latestObjectUrl);
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Failed to load latest prescription PDF:", error);
        }
        if (mounted) {
          setPdfUrl("");
        }
      } finally {
        if (mounted) {
          setIsPdfLoading(false);
        }
      }
    };

    const fetchPatientDetails = async () => {
      try {
        const res = await api.get("/patients/latest");
        const latest = res.data;
        console.log("Latest patient details:", latest);
        if (mounted) {
          setPatientDetails(latest);
        }
        await loadLatestPdf();
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch patient details:", error);
        }
      }
    };

    const fetchActiveConsultation = async () => {
      try {
        const res = await api.get("/consultation");
        applyConsultationSession(res.data);
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch active consultation session:", error);
        }
        applyConsultationSession(null);
      }
    };

    fetchPatientDetails();
    fetchActiveConsultation();

    const handlePrescriptionCreated = () => {
      fetchPatientDetails();
    };

    const handleConsultationLinkUpdated = (data) => {
      applyConsultationSession(data || null);
    };

    socket.on("prescriptionCreated", handlePrescriptionCreated);
    socket.on("consultationLinkUpdated", handleConsultationLinkUpdated);

    return () => {
      mounted = false;
      if (latestObjectUrl) {
        URL.revokeObjectURL(latestObjectUrl);
      }
      socket.off("prescriptionCreated", handlePrescriptionCreated);
      socket.off("consultationLinkUpdated", handleConsultationLinkUpdated);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(47,143,131,0.16)_0%,_rgba(255,248,238,1)_35%,_rgba(246,239,228,1)_72%,_rgba(243,236,225,1)_100%)] p-6 md:p-10">
      <div className="absolute -top-10 left-0 h-96 w-96 rounded-full bg-[#e4ad95] mix-blend-multiply blur-3xl opacity-45 animate-blob"></div>
      <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-[#8bc8bf] mix-blend-multiply blur-3xl opacity-45 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 h-96 w-96 rounded-full bg-[#dcc5a6] mix-blend-multiply blur-3xl opacity-45 animate-blob animation-delay-4000"></div>

      <div className="relative mx-auto max-w-6xl rounded-[2rem] border border-[#ead9c8] bg-white/72 p-6 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#8f4a35] font-semibold">Medibot Patient</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Consultation Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <button className="bg-red-400 hover:bg-red-600 text-white py-2 px-3 rounded-md">Logout</button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 md:py-20">
          <p className="max-w-xl text-center text-base md:text-lg text-slate-600">
            Join the live consultation as soon as your doctor shares the meeting room.
          </p>

          <div className="relative mt-12 flex items-center justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-[#db9e84]/35 blur-3xl animate-pulse"></div>
            <div className="absolute h-64 w-64 rounded-full border border-[#d9bca4]/60 animate-ping"></div>
            <div className="absolute h-80 w-80 rounded-full border border-[#8bc8bf]/70 animate-[spin_18s_linear_infinite]"></div>
            <div className="absolute h-56 w-56 rounded-full border-8 border-white/50 shadow-inner md:h-64 md:w-64"></div>

            <button
              type="button"
              onClick={() => {
                if (!consultationLink) {
                  alert("Consultation link is not available yet.");
                  return;
                }
                if (isJitsiEmbeddedMode) {
                  setIsEmbeddedCallVisible(true);
                  return;
                }
                window.open(consultationLink, "_blank", "noopener,noreferrer");
              }}
              disabled={!consultationLink}
              className="relative z-10 flex h-56 w-56 flex-col items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#b45b3f] via-[#b36a4b] to-[#2f8f83] text-xl font-black text-white shadow-[0_25px_80px_rgba(120,85,60,0.42)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 md:h-64 md:w-64 md:text-2xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{isJitsiEmbeddedMode ? "Start In-App Call" : "Call Doctor Now"}</span>
              <span className="text-sm md:text-base font-medium text-amber-50/90">
                {consultationLink ? `Tap to join via ${consultationPlatform}` : "Waiting for doctor"}
              </span>
            </button>
          </div>

          {consultationLink ? (
            <div className="mt-8 w-full max-w-3xl rounded-2xl border border-[#ead9c8] bg-white/85 p-4 shadow-lg">
              <p className="text-sm text-slate-700">
                Active platform: <span className="font-semibold text-slate-900">{consultationPlatform}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 break-all">{consultationLink}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.open(consultationLink, "_blank", "noopener,noreferrer")}
                  className="rounded-lg bg-[#b45b3f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9f4f36]"
                >
                  Open In New Tab
                </button>

                {isJitsiEmbeddedMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEmbeddedCallVisible((prev) => !prev)}
                    className="rounded-lg border border-[#b9dfd8] bg-[#edf9f6] px-4 py-2 text-sm font-semibold text-[#2f8f83] hover:bg-[#dff1ed]"
                  >
                    {isEmbeddedCallVisible ? "Hide In-App Call" : "Open In-App Call"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {isJitsiEmbeddedMode && isEmbeddedCallVisible && embeddedJitsiUrl ? (
            <div className="mt-8 w-full max-w-5xl rounded-2xl bg-white/85 border border-white/70 shadow-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800">In-App Jitsi Consultation</h3>
                <button
                  type="button"
                  onClick={() => setIsEmbeddedCallVisible(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
              <iframe
                title="Jitsi Consultation"
                src={embeddedJitsiUrl}
                className="w-full h-[560px] rounded-xl border border-slate-200"
                allow="camera; microphone; fullscreen; display-capture"
              />
            </div>
          ) : null}

          <div className="mt-12 w-full max-w-5xl rounded-2xl bg-white/80 border border-white/70 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-800">Latest Prescription PDF</h3>
              {isPdfLoading && <p className="text-sm text-slate-500">Loading PDF...</p>}
            </div>
            {pdfUrl ? (
              <iframe
                title="Latest Prescription PDF"
                src={pdfUrl}
                className="w-full h-[560px] rounded-xl border border-slate-200"
              />
            ) : (
              <p className="text-sm text-slate-500 p-6 text-center">
                Prescription PDF is not available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
