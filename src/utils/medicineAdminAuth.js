export const MEDICINE_ADMIN_AUTH_STORAGE_KEY = "medibot:medicine-admin-auth:v1";

const MEDICINE_ADMIN_USERNAME = "admin";
const MEDICINE_ADMIN_PASSWORD = "1234";

export const verifyMedicineAdminCredentials = (username, password) => {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "").trim();

  return (
    normalizedUsername === MEDICINE_ADMIN_USERNAME &&
    normalizedPassword === MEDICINE_ADMIN_PASSWORD
  );
};

export const setMedicineAdminAuthenticated = (isAuthenticated) => {
  if (isAuthenticated) {
    localStorage.setItem(MEDICINE_ADMIN_AUTH_STORAGE_KEY, "1");
    return;
  }

  localStorage.removeItem(MEDICINE_ADMIN_AUTH_STORAGE_KEY);
};

export const isMedicineAdminAuthenticated = () =>
  localStorage.getItem(MEDICINE_ADMIN_AUTH_STORAGE_KEY) === "1";
