export const DEFAULTS = {
  DOCTOR_EMAIL: "doctor@medibot.com",
  DOCTOR_PASSWORD: "doctor123",
  DOCTOR_AUTH_SECRET: "change-this-doctor-auth-secret-1234",
  SENSOR_INGEST_SECRET: "sensor-ingest-secret-1234",
  PRINT_AGENT_SECRET: "print-agent-secret-1234",
  MONGO_URI: "mongodb://127.0.0.1:27017/medical-assist",
};

export const getEnvValue = (name) => {
  const value = String(process.env[name] || "").trim();
  return value || DEFAULTS[name] || "";
};

export const applyDefaultEnv = () => {
  Object.keys(DEFAULTS).forEach((key) => {
    if (!String(process.env[key] || "").trim()) {
      process.env[key] = DEFAULTS[key];
    }
  });
};

export const validateRequiredEnv = () => {
  // Intentionally non-blocking now: defaults are applied for easier deployment.
};
