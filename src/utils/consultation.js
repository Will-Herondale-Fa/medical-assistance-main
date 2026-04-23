const PLATFORM_LABELS = {
  jitsi: "Jitsi Meet",
  "google-meet": "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  custom: "Custom Link",
};

const PLATFORM_HOST_RULES = {
  jitsi: (hostname) => hostname === "meet.jit.si" || hostname.endsWith(".meet.jit.si"),
  "google-meet": (hostname) => hostname === "meet.google.com",
  zoom: (hostname) => hostname === "zoom.us" || hostname.endsWith(".zoom.us"),
  teams: (hostname) =>
    hostname === "teams.microsoft.com" ||
    hostname.endsWith(".teams.microsoft.com") ||
    hostname === "teams.live.com",
  custom: () => true,
};

export const supportedConsultationPlatforms = [
  {
    value: "jitsi",
    label: "Jitsi Meet (in-app or external)",
    helper: "Best for built-in browser consultations without extra app installs.",
  },
  {
    value: "google-meet",
    label: "Google Meet",
    helper: "Use any secure meet.google.com meeting URL.",
  },
  {
    value: "zoom",
    label: "Zoom",
    helper: "Use a secure zoom.us meeting URL.",
  },
  {
    value: "teams",
    label: "Microsoft Teams",
    helper: "Use a secure teams meeting URL.",
  },
  {
    value: "custom",
    label: "Other Platform",
    helper: "Use any secure HTTPS call URL.",
  },
];

const trimTrailingSlashes = (value) => String(value || "").replace(/\/+$/, "");

export const platformLabel = (platform) => PLATFORM_LABELS[platform] || PLATFORM_LABELS.custom;

export const inferConsultationPlatform = (meetingLink) => {
  try {
    const hostname = new URL(String(meetingLink || "")).hostname.toLowerCase();

    if (PLATFORM_HOST_RULES.jitsi(hostname)) {
      return "jitsi";
    }
    if (PLATFORM_HOST_RULES["google-meet"](hostname)) {
      return "google-meet";
    }
    if (PLATFORM_HOST_RULES.zoom(hostname)) {
      return "zoom";
    }
    if (PLATFORM_HOST_RULES.teams(hostname)) {
      return "teams";
    }

    return "custom";
  } catch {
    return "custom";
  }
};

export const sanitizeJitsiRoomName = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export const createAutoJitsiRoom = ({ doctorName = "", patientName = "" } = {}) => {
  const doctorPart = sanitizeJitsiRoomName(doctorName).toLowerCase();
  const patientPart = sanitizeJitsiRoomName(patientName).toLowerCase();
  const suffix = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);

  return [doctorPart || "doctor", patientPart || "patient", ts, suffix]
    .filter(Boolean)
    .join("-")
    .slice(0, 120);
};

export const buildJitsiMeetingLink = (roomName) => {
  const normalizedRoom = sanitizeJitsiRoomName(roomName);
  if (!normalizedRoom) {
    throw new Error("Jitsi room name is required");
  }

  return `https://meet.jit.si/${encodeURIComponent(normalizedRoom)}`;
};

export const extractJitsiRoomName = (meetingLink) => {
  try {
    const parsed = new URL(String(meetingLink || ""));
    const firstPathSegment = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return sanitizeJitsiRoomName(decodeURIComponent(firstPathSegment));
  } catch {
    return "";
  }
};

export const isPublicJitsiHost = (meetingLink) => {
  try {
    const hostname = new URL(String(meetingLink || "")).hostname.toLowerCase();
    return hostname === "meet.jit.si" || hostname.endsWith(".meet.jit.si");
  } catch {
    return false;
  }
};

export const canUseInAppJitsiEmbed = (meetingLink) =>
  Boolean(meetingLink) && !isPublicJitsiHost(meetingLink);

export const normalizeMeetingLinkForPlatform = (meetingLink, platform) => {
  const parsed = new URL(String(meetingLink || "").trim());

  if (parsed.protocol !== "https:") {
    throw new Error("Meeting link must use https");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Meeting link cannot include username or password");
  }

  const normalizedPlatform = platform || inferConsultationPlatform(parsed.toString());
  const rule = PLATFORM_HOST_RULES[normalizedPlatform] || PLATFORM_HOST_RULES.custom;

  if (!rule(parsed.hostname.toLowerCase())) {
    throw new Error(`This link does not match ${platformLabel(normalizedPlatform)}`);
  }

  parsed.hash = "";
  return trimTrailingSlashes(parsed.toString());
};
