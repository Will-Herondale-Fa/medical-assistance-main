import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import socket, { refreshSocketAuth } from "../socket/socket";
import VitalCard from "../components/VitalCard";
import InputField from "../components/InputField";
import MediDispanserCard from "../components/MediDispanserCard";
import { commonMedicines } from "../utils/commonMedicines";
import { clearDoctorToken } from "../utils/auth";
import {
  buildJitsiMeetingLink,
  createAutoJitsiRoom,
  extractJitsiRoomName,
  inferConsultationPlatform,
  normalizeMeetingLinkForPlatform,
  platformLabel,
  supportedConsultationPlatforms,
} from "../utils/consultation";

const CONSULTATION_CREATOR_LINKS = {
  "google-meet": "https://meet.google.com/new",
  zoom: "https://zoom.us/meeting/schedule",
  teams: "https://teams.microsoft.com/_#/scheduling-form/?opener=1&navCtx=calendar",
};

export default function DoctorDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [medicines, setMedicines] = useState([{ name: "", type: "", dosage: "" }]);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [consultationDraft, setConsultationDraft] = useState(() => ({
    platform: "jitsi",
    meetingLink: "",
    roomName: createAutoJitsiRoom(),
    openMode: "in-app",
    title: "",
  }));
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);
  const [isClearingConsultation, setIsClearingConsultation] = useState(false);
  const [printAgentStatus, setPrintAgentStatus] = useState({ online: false, count: 0, agents: [] });

  const [formData, setFormData] = useState({
    patientName: "",
    doctorName: "",
    age: "",
    sex: "male",
    temperature: "",
    pulse: "",
    spo2: "",
    weight: "",
    bloodPressure: "",
    allergies: "",
    disabilities: "",
    diagnosis: "",
  });
  const [sensorData, setSensorData] = useState(null);
  const [latestPatientDetails, setLatestPatientDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedVitals, setAddedVitals] = useState({
    temperature: false, 
    pulse: false,
    spo2: false,
    weight: false,
  });

  // Listen for real-time sensor updates
  useEffect(() => {
    let mounted = true;

    const applyConsultationSession = (session) => {
      if (!mounted) {
        return;
      }

      if (!session?.meetingLink) {
        setActiveConsultation(null);
        return;
      }

      const sessionPlatform = session.platform || inferConsultationPlatform(session.meetingLink);
      const roomName =
        sessionPlatform === "jitsi"
          ? session.roomName || extractJitsiRoomName(session.meetingLink)
          : "";

      const normalizedSession = {
        ...session,
        platform: sessionPlatform,
        roomName,
      };

      setActiveConsultation(normalizedSession);
      setConsultationDraft((prev) => ({
        ...prev,
        platform: sessionPlatform,
        meetingLink: session.meetingLink,
        roomName:
          sessionPlatform === "jitsi"
            ? roomName || prev.roomName || createAutoJitsiRoom()
            : prev.roomName,
        openMode:
          sessionPlatform === "jitsi" && session.openMode === "in-app"
            ? "in-app"
            : "external",
        title: String(session.title || "").trim() || prev.title,
      }));
    };

    const fetchLatestSensor = async () => {
      try {
        const res = await api.get("/sensors/latest");
        if (mounted && res.data) {
          setSensorData(res.data);
        }
      } catch (error) {
        console.error("Latest sensor fetch failed:", error);
      }
    };

    const fetchActiveConsultation = async () => {
      try {
        const res = await api.get("/consultation");
        applyConsultationSession(res.data);
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch active consultation:", error);
        }
        if (mounted) {
          setActiveConsultation(null);
        }
      }
    };

    fetchLatestSensor();
    fetchActiveConsultation();

    const handleSensorUpdate = (data) => {
      if (!data) {
        return;
      }
      console.log("Live Sensor:", data);
      setSensorData(data);
    };
    const handleSocketConnect = () => {
      fetchLatestSensor();
    };

    socket.on("sensorUpdate", handleSensorUpdate);
    socket.on("connect", handleSocketConnect);
    const handleConsultationLinkUpdated = (data) => {
      applyConsultationSession(data || null);
    };
    const handleConsultationLinkError = (payload) => {
      const message = String(payload?.message || "").trim();
      if (message) {
        alert(message);
      }
    };
    const handlePrintAgentStatusUpdated = (data) => {
      setPrintAgentStatus({
        online: Boolean(data?.online),
        count: Number(data?.count || 0),
        agents: Array.isArray(data?.agents) ? data.agents : [],
      });
    };
    const handleConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
    };

    socket.on("consultationLinkUpdated", handleConsultationLinkUpdated);
    socket.on("consultationLinkError", handleConsultationLinkError);
    socket.on("printAgentStatusUpdated", handlePrintAgentStatusUpdated);
    socket.on("connect_error", handleConnectError);

    return () => {
      mounted = false;
      socket.off("sensorUpdate", handleSensorUpdate);
      socket.off("connect", handleSocketConnect);
      socket.off("consultationLinkUpdated", handleConsultationLinkUpdated);
      socket.off("consultationLinkError", handleConsultationLinkError);
      socket.off("printAgentStatusUpdated", handlePrintAgentStatusUpdated);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  const handleSubmit = async () => {
    const payload = {
      patientName: formData.patientName,
      doctorName: formData.doctorName,
      age: formData.age,
      sex: formData.sex,
      temperature: formData.temperature,
      pulse: formData.pulse,
      spo2: formData.spo2,
      weight: formData.weight,
      bloodPressure: formData.bloodPressure,
      allergies: formData.allergies,
      disabilities: formData.disabilities,
      diagnosis: formData.diagnosis,
      medicines: medicines.filter((med) => med.name?.trim()),
    };

    if (!payload.patientName.trim()) {
      alert("Patient name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/patients", payload);
      socket.emit("prescriptionCreated", {
        patientId: res?.data?._id,
        createdAt: res?.data?.createdAt,
        patient: res?.data,
      });
      setLatestPatientDetails(res.data);
      console.log("Latest patient details:", res.data);
      alert("Patient and prescription saved successfully.");
      console.log(res.data);

      setFormData({
        patientName: "",
        doctorName: "",
        age: "",
        sex: "male",
        temperature: "",
        pulse: "",
        spo2: "",
        weight: "",
        bloodPressure: "",
        allergies: "",
        disabilities: "",
        diagnosis: "",
      });
      setMedicines([{ name: "", type: "", dosage: "" }]);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to save patient details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", type: "", dosage: "" }]);
  };

  const handleLogout = () => {
    clearDoctorToken();
    refreshSocketAuth();
  };

  const resolveConsultationPayload = () => {
    const nextPlatform = consultationDraft.platform || "custom";
    const basePayload = {
      platform: nextPlatform,
      title: String(consultationDraft.title || "").trim(),
      doctorName: formData.doctorName?.trim() || latestPatientDetails?.doctorName || "",
      updatedAt: new Date().toISOString(),
    };

    if (nextPlatform === "jitsi") {
      const nextRoomName =
        String(consultationDraft.roomName || "").trim() ||
        createAutoJitsiRoom({
          doctorName: formData.doctorName,
          patientName: formData.patientName,
        });

      let jitsiLink = "";
      const draftLink = String(consultationDraft.meetingLink || "").trim();
      if (draftLink) {
        try {
          jitsiLink = normalizeMeetingLinkForPlatform(draftLink, "jitsi");
        } catch {
          jitsiLink = "";
        }
      }
      if (!jitsiLink) {
        jitsiLink = buildJitsiMeetingLink(nextRoomName);
      }

      const normalizedLink = normalizeMeetingLinkForPlatform(jitsiLink, "jitsi");

      return {
        ...basePayload,
        meetingLink: normalizedLink,
        roomName: extractJitsiRoomName(normalizedLink) || nextRoomName,
        openMode: consultationDraft.openMode === "in-app" ? "in-app" : "external",
      };
    }

    const normalizedLink = normalizeMeetingLinkForPlatform(
      consultationDraft.meetingLink,
      nextPlatform
    );

    return {
      ...basePayload,
      meetingLink: normalizedLink,
      roomName: "",
      openMode: "external",
    };
  };

  const handleConsultationLinkSubmit = async ({ openAfterShare = false } = {}) => {
    try {
      setIsSavingConsultation(true);

      const payload = resolveConsultationPayload();
      const res = await api.put("/consultation", payload);
      const nextSession = res.data;

      setActiveConsultation(nextSession);
      setConsultationDraft((prev) => ({
        ...prev,
        platform: nextSession.platform || prev.platform,
        meetingLink: nextSession.meetingLink || prev.meetingLink,
        roomName: nextSession.roomName || prev.roomName,
        openMode: nextSession.openMode || prev.openMode,
        title: nextSession.title || prev.title,
      }));

      if (openAfterShare) {
        window.open(nextSession.meetingLink, "_blank", "noopener,noreferrer");
      }

      alert("Consultation details shared successfully.");
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Failed to share consultation link.");
    } finally {
      setIsSavingConsultation(false);
    }
  };

  const handleClearConsultation = async () => {
    if (!activeConsultation?.meetingLink) {
      return;
    }

    try {
      setIsClearingConsultation(true);
      await api.delete("/consultation");
      setActiveConsultation(null);
      alert("Consultation session has been cleared.");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to clear consultation session.");
    } finally {
      setIsClearingConsultation(false);
    }
  };

  const handleGenerateJitsiRoom = () => {
    const nextRoom = createAutoJitsiRoom({
      doctorName: formData.doctorName,
      patientName: formData.patientName,
    });

    setConsultationDraft((prev) => ({
      ...prev,
      platform: "jitsi",
      roomName: nextRoom,
      meetingLink: "",
    }));
  };

  const handleOpenActiveConsultation = () => {
    if (!activeConsultation?.meetingLink) {
      alert("No active consultation link found.");
      return;
    }
    window.open(activeConsultation.meetingLink, "_blank", "noopener,noreferrer");
  };

  const handlePrintLatestPrescription = async () => {
    try {
      let latest = latestPatientDetails;
      if (!latest) {
        const res = await api.get("/patients/latest");
        latest = res.data;
      }

      if (!latest) {
        alert("No patient prescription found to print.");
        return;
      }
      if (!printAgentStatus.online) {
        alert("Silent print agent is offline on the patient machine.");
        return;
      }

      console.log("Latest patient details:", latest);
      socket.emit("printLatestPrescription", {
        patientId: latest?._id,
        patient: latest,
      });
      alert("Print request sent to patient dashboard.");
    } catch (error) {
      console.error("Failed to fetch latest patient details for print:", error);
      alert("Failed to fetch latest patient details.");
    }
  };

  const addVitalToPrescription = (field, value) => {
    if (value === "--" || value === undefined || value === null) {
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: String(value) }));
    setAddedVitals((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setAddedVitals((prev) => ({ ...prev, [field]: false }));
    }, 700);
  };

  const liveTemperature = sensorData?.temperature ?? "--";
  const liveHeartRate = sensorData?.heartRate ?? "--";
  const liveWeight = sensorData?.weight ?? "--";
  const lastUpdated = sensorData?.createdAt
    ? new Date(sensorData.createdAt).toLocaleString()
    : "Waiting for live data";
  const livePatientLabel =
    sensorData?.patientName ||
    sensorData?.deviceId ||
    "Unknown patient/device";

  const activeConsultationLink = activeConsultation?.meetingLink || "";
  const activeConsultationPlatform = platformLabel(
    activeConsultation?.platform || inferConsultationPlatform(activeConsultationLink)
  );
  const activeConsultationUpdatedAt = activeConsultation?.updatedAt
    ? new Date(activeConsultation.updatedAt).toLocaleString()
    : "";
  const selectedPlatformMeta =
    supportedConsultationPlatforms.find((item) => item.value === consultationDraft.platform) ||
    supportedConsultationPlatforms[supportedConsultationPlatforms.length - 1];
  const jitsiPreviewLink = (() => {
    if (consultationDraft.platform !== "jitsi" || !consultationDraft.roomName) {
      return "";
    }
    try {
      return buildJitsiMeetingLink(consultationDraft.roomName);
    } catch {
      return "";
    }
  })();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dff7ff_0%,_#edf9ff_28%,_#f8fbff_55%,_#eefbf4_100%)]">
      {/* HEADER */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-100 bg-white/85 px-6 py-4 backdrop-blur-md md:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Medibot Clinical</p>
          <h1 className="text-lg font-black text-slate-900 md:text-xl">Doctor Dashboard</h1>
        </div>
        <Link to="/" className="text-cyan-600 hover:underline">
          <button
          onClick={handleLogout}
          className="rounded-xl bg-rose-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-rose-600">
          Logout
          </button>
        </Link>
      
      </header>

      <div className="space-y-8 p-5 md:p-8">
        <div className="flex flex-col gap-2 rounded-2xl border border-cyan-100 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm md:flex-row md:items-center md:justify-between">
          <p>
            Live Source: <span className="font-semibold text-slate-900">{livePatientLabel}</span>
          </p>
          <p>
            Last Update: <span className="font-semibold text-slate-900">{lastUpdated}</span>
          </p>
        </div>

        {/* VITALS DASHBOARD */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <VitalCard
            title="Current Time"
            value={currentTime.toLocaleTimeString()}
            icon={
              <svg className="w-12 h-12 text-cyan-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
              </svg>
            }
          />
          <VitalCard
            title="Temp (deg C)"
            value={liveTemperature === "--" ? "--" : `${liveTemperature} C`}
            onAdd={() => addVitalToPrescription("temperature", liveTemperature)}
            added={addedVitals.temperature}
            icon={
              <svg className="w-12 h-12 text-rose-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a6 6 0 016 6v7a6 6 0 11-12 0V8a6 6 0 016-6z" />
                <circle cx="12" cy="17" r="3" fill="currentColor" />
              </svg>
            }
          />
          <VitalCard
            title="Pulse (bpm)"
            value={liveHeartRate === "--" ? "--" : `${liveHeartRate} bpm`}
            onAdd={() => addVitalToPrescription("pulse", liveHeartRate)}
            added={addedVitals.pulse}
            icon={
              <svg className="w-12 h-12 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h3l2-4 4 8 2-4h5" />
              </svg>
            }
          />
          {/* <VitalCard
            title="SpO2 (%)"
            value={liveSpo2 === "--" ? "--" : `${liveSpo2}%`}
            onAdd={() => addVitalToPrescription("spo2", liveSpo2)}
            added={addedVitals.spo2}
            icon={
              <svg className="w-12 h-12 text-slate-500 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="8" width="12" height="8" rx="4" strokeWidth="2" stroke="currentColor" fill="none" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            }
          /> */}
          <VitalCard
            title="Weight (kg)"
            value={liveWeight === "--" ? "--" : `${Number(liveWeight).toFixed(2)} kg`}
            onAdd={() => addVitalToPrescription("weight", liveWeight)}
            added={addedVitals.weight}
            icon={
              <svg className="w-12 h-12 text-indigo-500 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="5" y="7" width="14" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            }
          />
        </div>

        {/* CONSULTATION CONTROLS */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsConsultationModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-8 py-3 text-base text-white shadow-lg shadow-cyan-200 transition hover:from-cyan-700 hover:to-sky-700 md:text-lg"
            >
              Configure Consultation
            </button>
            <button
              type="button"
              onClick={handleOpenActiveConsultation}
              disabled={!activeConsultationLink}
              className="bg-emerald-600 text-white text-base px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-55 disabled:cursor-not-allowed"
            >
              Open Active Call
            </button>
            <button
              type="button"
              onClick={handleClearConsultation}
              disabled={!activeConsultationLink || isClearingConsultation}
              className="bg-rose-600 text-white text-base px-6 py-3 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isClearingConsultation ? "Ending..." : "End Active Session"}
            </button>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-lg">
            {activeConsultationLink ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Active platform: <span className="font-semibold text-slate-900">{activeConsultationPlatform}</span>
                </p>
                <p className="text-sm text-slate-600 break-all">
                  Join URL: <span className="font-medium text-cyan-700">{activeConsultationLink}</span>
                </p>
                {activeConsultationUpdatedAt ? (
                  <p className="text-xs text-slate-500">Last updated: {activeConsultationUpdatedAt}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                No active consultation session. Configure a platform and share it to patient dashboards.
              </p>
            )}
          </div>
        </div>

        {/* PRESCRIPTION FORM */}
        <div className="space-y-7 rounded-3xl border border-cyan-100 bg-white/95 p-6 shadow-xl shadow-cyan-100/60 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Prescription & Medical Record</h2>
            <span className="hidden sm:inline-flex text-xs font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
              Doctor Entry
            </span>
          </div>

          {/* Row 1 */}
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Patient Name"
              value={formData.patientName}
              placeholder="Enter full patient name"
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            />
            <InputField
              label="Doctor Name"
              value={formData.doctorName}
              placeholder="Enter consulting doctor name"
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
            />
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-3 gap-4">
            <InputField
              label="Age"
              type="number"
              value={formData.age}
              placeholder="Enter age in years"
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />

            <div>
              <label className="block font-medium mb-2 text-slate-700">Sex</label>
              <div className="flex gap-4">
                {["male", "female","other"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="sex"
                      value={option}
                      checked={formData.sex === option}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    />
                    <span className="capitalize text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <InputField
              label="Blood Pressure"
              value={formData.bloodPressure}
              placeholder="e.g. 120/80 mmHg"
              onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
            />
          </div>

          {/* Row 3 */}
          <div className="grid md:grid-cols-4 gap-4">
            <InputField
              label="Temperature (deg C)"
              type="number"
              value={formData.temperature}
              placeholder="e.g. 37.4"
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
            />
            <InputField
              label="Pulse (bpm)"
              type="number"
              value={formData.pulse}
              placeholder="e.g. 84"
              onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
            />
            <InputField
              label="SpO2 (%)"
              type="number"
              value={formData.spo2}
              placeholder="e.g. 98"
              onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
            />
            <InputField
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              placeholder="e.g. 70"
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>

          {/* Row 4 */}
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Allergies"
              value={formData.allergies}
              placeholder="List known allergies or write None"
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            />
            <InputField
              label="Disabilities"
              value={formData.disabilities}
              placeholder="Mention any physical or cognitive disability"
              onChange={(e) => setFormData({ ...formData, disabilities: e.target.value })}
            />
          </div>

          {/* Row 5 */}
          <div>
            <label className="block font-medium mb-1 text-slate-700">Diagnosis & Clinical Notes</label>
            <textarea
              rows="4"
              className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="Enter diagnosis, symptoms, findings, and treatment notes"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          {/* MEDICINE TABLE */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">Prescribed Medications</h3>

            {medicines.map((med, index) => (
              <div key={index} className="grid md:grid-cols-3 gap-4">
                <input
                  list="common-medicines"
                  placeholder="Search or select medicine name"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  value={med.name}
                  onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                />
                <select
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  value={med.type}
                  onChange={(e) => handleMedicineChange(index, "type", e.target.value)}
                >
                  <option value="">Select medication type</option>
                  <option>Tablet</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                </select>
                <input
                  placeholder="e.g. 1 tablet twice daily after meals"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  value={med.dosage}
                  onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                />
              </div>
            ))}
            <datalist id="common-medicines">
              {commonMedicines.map((medicine) => (
                <option key={medicine} value={medicine} />
              ))}
            </datalist>

            <button
              type="button"
              onClick={addMedicineRow}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              Add Medicine
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 pt-4">
            <div className={`rounded-xl border px-4 py-3 text-sm ${
          printAgentStatus.online
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <p className="font-semibold">
            {printAgentStatus.online
              ? `print agent online (${printAgentStatus.count})`
              : "print agent offline"}
          </p>
        </div>
            <button
              type="button"
              onClick={handlePrintLatestPrescription}
              disabled={!printAgentStatus.online}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print Latest PDF
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
          {/* MEDI DISPENSER CONTROL */}
          <MediDispanserCard />
        </div>
      </div>

      {isConsultationModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Consultation Control Center</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Choose a call platform, validate the meeting URL, and instantly sync it to all patient dashboards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConsultationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                aria-label="Close consultation modal"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Platform
                </label>
                <select
                  value={consultationDraft.platform}
                  onChange={(e) =>
                    setConsultationDraft((prev) => ({
                      ...prev,
                      platform: e.target.value,
                      openMode: e.target.value === "jitsi" ? prev.openMode : "external",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  {supportedConsultationPlatforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">{selectedPlatformMeta.helper}</p>
              </div>

              {consultationDraft.platform === "jitsi" ? (
                <>
                  <div className="grid md:grid-cols-[1fr_auto] gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Jitsi Room Name
                      </label>
                      <input
                        type="text"
                        value={consultationDraft.roomName}
                        onChange={(e) =>
                          setConsultationDraft((prev) => ({
                            ...prev,
                            roomName: e.target.value,
                            meetingLink: "",
                          }))
                        }
                        placeholder="doctor-patient-live-room"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateJitsiRoom}
                      className="self-end rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-700 hover:bg-cyan-100"
                    >
                      Generate Room
                    </button>
                  </div>

                  {jitsiPreviewLink ? (
                    <p className="text-xs text-slate-500 break-all">
                      Jitsi URL preview: <span className="font-medium text-slate-700">{jitsiPreviewLink}</span>
                    </p>
                  ) : null}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Patient Join Mode
                    </label>
                    <select
                      value={consultationDraft.openMode}
                      onChange={(e) =>
                        setConsultationDraft((prev) => ({
                          ...prev,
                          openMode: e.target.value === "in-app" ? "in-app" : "external",
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="in-app">Open inside patient dashboard (embedded Jitsi)</option>
                      <option value="external">Open in new browser tab</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={consultationDraft.meetingLink}
                    onChange={(e) =>
                      setConsultationDraft((prev) => ({
                        ...prev,
                        meetingLink: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Title (optional)
                </label>
                <input
                  type="text"
                  value={consultationDraft.title}
                  onChange={(e) =>
                    setConsultationDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Daily follow-up consultation"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700 mb-2">Quick scheduler shortcuts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CONSULTATION_CREATOR_LINKS).map(([platform, url]) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Open {platformLabel(platform)} Scheduler
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConsultationModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConsultationLinkSubmit()}
                disabled={isSavingConsultation}
                className="rounded-xl bg-cyan-600 px-5 py-2 text-white hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingConsultation ? "Sharing..." : "Share With Patient"}
              </button>
              <button
                type="button"
                onClick={() => handleConsultationLinkSubmit({ openAfterShare: true })}
                disabled={isSavingConsultation}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Share And Start Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
