import crypto from "crypto";

const base64UrlEncode = (value) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
};

const getSecret = () => {
  const secret = String(process.env.DOCTOR_AUTH_SECRET || "").trim();
  if (!secret) {
    throw new Error("DOCTOR_AUTH_SECRET is missing");
  }
  if (secret.length < 16) {
    throw new Error("DOCTOR_AUTH_SECRET must be at least 16 characters");
  }
  return secret;
};

const signPayload = (payloadEncoded) =>
  crypto
    .createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const isSignatureMatch = (providedSignature, expectedSignature) => {
  const provided = Buffer.from(String(providedSignature || ""), "utf8");
  const expected = Buffer.from(String(expectedSignature || ""), "utf8");
  if (provided.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(provided, expected);
};

export const createDoctorToken = ({ email }, expiresInSeconds = 60 * 60 * 24) => {
  const payload = {
    email,
    role: "doctor",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
};

export const verifyDoctorToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "invalid token format" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "invalid token format" };
  }

  const [payloadEncoded, signature] = parts;
  let expectedSignature;
  try {
    expectedSignature = signPayload(payloadEncoded);
  } catch (error) {
    return {
      valid: false,
      reason: error?.message || "token verification is not configured",
    };
  }

  if (!isSignatureMatch(signature, expectedSignature)) {
    return { valid: false, reason: "invalid signature" };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (!payload || typeof payload.exp !== "number") {
      return { valid: false, reason: "invalid payload" };
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: "token expired" };
    }
    if (payload.role !== "doctor") {
      return { valid: false, reason: "invalid role" };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "invalid payload" };
  }
};
