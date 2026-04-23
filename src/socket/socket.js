import { io } from "socket.io-client";
import { getDoctorToken } from "../utils/auth";

const resolveDefaultSocketUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }

  const { hostname, protocol, origin } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return `${protocol}//${hostname}:4000`;
  }

  return origin;
};

const defaultSocketUrl = resolveDefaultSocketUrl();

const resolveSocketAuth = () => {
  const doctorToken = getDoctorToken();
  if (doctorToken) {
    return { role: "doctor", token: doctorToken };
  }
  return { role: "patient" };
};

const socket = io(import.meta.env.VITE_SOCKET_URL || defaultSocketUrl, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export const refreshSocketAuth = () => {
  socket.auth = resolveSocketAuth();
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

socket.auth = resolveSocketAuth();
socket.connect();

export default socket;
