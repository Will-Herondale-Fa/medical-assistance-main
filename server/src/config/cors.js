const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const normalizeOrigin = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;

  return withProtocol.replace(/\/+$/, "");
};

const parseAllowedOrigins = () => {
  const explicit = String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  if (explicit.length > 0) {
    return new Set(explicit);
  }

  const hosterOrigins = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  if (hosterOrigins.length > 0) {
    return new Set([...LOCAL_ORIGINS, ...hosterOrigins]);
  }

  // If no allowlist is configured, keep CORS open so hosted frontends can connect.
  return null;
};

const allowedOrigins = parseAllowedOrigins();

export const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }
  if (!allowedOrigins) {
    return true;
  }
  return allowedOrigins.has(normalizeOrigin(origin));
};

export const getExpressCorsOptions = () => ({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS blocked for this origin"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Sensor-Secret"],
});

export const getSocketCorsOptions = () => ({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Socket CORS blocked for this origin"));
  },
  methods: ["GET", "POST"],
});
