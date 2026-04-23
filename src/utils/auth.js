const DOCTOR_TOKEN_KEY = "doctor_auth_token";

const getStorage = () =>
  typeof window !== "undefined" ? window.localStorage : null;

export const getDoctorToken = () => {
  const storage = getStorage();
  return storage?.getItem(DOCTOR_TOKEN_KEY) || "";
};

export const setDoctorToken = (token) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(DOCTOR_TOKEN_KEY, token);
};

export const clearDoctorToken = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(DOCTOR_TOKEN_KEY);
};

export const hasDoctorToken = () => Boolean(getDoctorToken());

export const isDoctorLoggedIn = () => hasDoctorToken();
