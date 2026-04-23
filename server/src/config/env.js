const REQUIRED_ENV_VARS = [
  "DOCTOR_EMAIL",
  "DOCTOR_PASSWORD",
  "DOCTOR_AUTH_SECRET",
  "SENSOR_INGEST_SECRET",
  "PRINT_AGENT_SECRET",
];

const getMissingRequiredEnvVars = () =>
  REQUIRED_ENV_VARS.filter((name) => !String(process.env[name] || "").trim());

export const validateRequiredEnv = () => {
  const missing = getMissingRequiredEnvVars();

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};
