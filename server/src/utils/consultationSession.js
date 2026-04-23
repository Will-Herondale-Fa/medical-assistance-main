const SUPPORTED_PLATFORMS = new Set([
  "google-meet",
  "zoom",
  "teams",
  "jitsi",
  "custom",
]);

const HOST_RULES = {
  "google-meet": (hostname) => hostname === "meet.google.com",
  zoom: (hostname) => hostname === "zoom.us" || hostname.endsWith(".zoom.us"),
  teams: (hostname) =>
    hostname === "teams.microsoft.com" ||
    hostname.endsWith(".teams.microsoft.com") ||
    hostname === "teams.live.com",
  jitsi: (hostname) => hostname === "meet.jit.si" || hostname.endsWith(".meet.jit.si"),
  custom: () => true,
};

let activeConsultationSession = null;

const sanitizeRoomName = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export const inferConsultationPlatform = (meetingLink) => {
  try {
    const parsed = new URL(String(meetingLink || ""));
    const hostname = parsed.hostname.toLowerCase();

    if (HOST_RULES["google-meet"](hostname)) {
      return "google-meet";
    }
    if (HOST_RULES.zoom(hostname)) {
      return "zoom";
    }
    if (HOST_RULES.teams(hostname)) {
      return "teams";
    }
    if (HOST_RULES.jitsi(hostname)) {
      return "jitsi";
    }

    return "custom";
  } catch {
    return "custom";
  }
};

const validateMeetingLink = (meetingLink, platform) => {
  const parsed = new URL(String(meetingLink || "").trim());

  if (parsed.protocol !== "https:") {
    throw new Error("Consultation link must use https");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Consultation link cannot include credentials");
  }

  const normalizedPlatform = platform || inferConsultationPlatform(parsed.toString());
  const rule = HOST_RULES[normalizedPlatform] || HOST_RULES.custom;
  const hostname = parsed.hostname.toLowerCase();

  if (!rule(hostname)) {
    throw new Error(`Link hostname is not valid for ${normalizedPlatform}`);
  }

  return {
    normalizedLink: parsed.toString(),
    normalizedPlatform,
  };
};

const normalizeOpenMode = (platform, openMode) => {
  if (platform !== "jitsi") {
    return "external";
  }
  return openMode === "in-app" ? "in-app" : "external";
};

export const normalizeConsultationSession = (payload = {}) => {
  const meetingLink = String(payload.meetingLink || "").trim();
  if (!meetingLink) {
    throw new Error("meetingLink is required");
  }

  const incomingPlatform = String(payload.platform || "").trim().toLowerCase();
  const requestedPlatform = SUPPORTED_PLATFORMS.has(incomingPlatform)
    ? incomingPlatform
    : undefined;

  const { normalizedLink, normalizedPlatform } = validateMeetingLink(
    meetingLink,
    requestedPlatform
  );

  const roomNameFromPath =
    normalizedPlatform === "jitsi"
      ? sanitizeRoomName(new URL(normalizedLink).pathname.split("/").filter(Boolean)[0])
      : "";

  const roomName =
    normalizedPlatform === "jitsi"
      ? sanitizeRoomName(payload.roomName) || roomNameFromPath
      : "";

  const updatedAtInput = String(payload.updatedAt || "").trim();
  const updatedAt =
    updatedAtInput && !Number.isNaN(Date.parse(updatedAtInput))
      ? new Date(updatedAtInput).toISOString()
      : new Date().toISOString();

  return {
    meetingLink: normalizedLink,
    platform: normalizedPlatform,
    roomName,
    openMode: normalizeOpenMode(normalizedPlatform, payload.openMode),
    doctorName: String(payload.doctorName || "").trim(),
    title: String(payload.title || "").trim(),
    updatedAt,
  };
};

export const getConsultationSession = () => activeConsultationSession;

export const setConsultationSession = (payload) => {
  activeConsultationSession = normalizeConsultationSession(payload);
  return activeConsultationSession;
};

export const clearConsultationSession = () => {
  activeConsultationSession = null;
};
