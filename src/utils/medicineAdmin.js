export const MEDICINE_ADMIN_STORAGE_KEY = "medibot:medicine-admin:v1";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeDateOnly = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().slice(0, 10);
};

export const normalizeMedicineAdminItem = (item = {}) => ({
  id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  name: String(item.name || "").trim(),
  batchNo: String(item.batchNo || "").trim(),
  expiryDate: normalizeDateOnly(item.expiryDate),
  stockQty: Math.max(0, toNumber(item.stockQty, 0)),
  lowStockThreshold: Math.max(0, toNumber(item.lowStockThreshold, 10)),
  notes: String(item.notes || "").trim(),
  updatedAt: new Date().toISOString(),
});

export const readMedicineAdminItems = () => {
  try {
    const raw = localStorage.getItem(MEDICINE_ADMIN_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => normalizeMedicineAdminItem(item));
  } catch {
    return [];
  }
};

export const writeMedicineAdminItems = (items) => {
  localStorage.setItem(MEDICINE_ADMIN_STORAGE_KEY, JSON.stringify(items));
};

const daysUntil = (dateStr) => {
  if (!dateStr) {
    return null;
  }
  const now = new Date();
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const diffMs = target.getTime() - now.setHours(0, 0, 0, 0);
  return Math.floor(diffMs / 86400000);
};

export const getMedicineStatus = (item) => {
  const expiryDays = daysUntil(item?.expiryDate);
  const isExpired = expiryDays !== null && expiryDays < 0;
  const isExpiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;
  const isLowStock =
    Number(item?.stockQty ?? 0) <= Number(item?.lowStockThreshold ?? 0);

  if (isExpired) {
    return { tone: "danger", label: "Expired", expiryDays, isLowStock };
  }
  if (isExpiringSoon && isLowStock) {
    return { tone: "warn", label: "Expiring + Low Stock", expiryDays, isLowStock };
  }
  if (isExpiringSoon) {
    return { tone: "warn", label: "Expiring Soon", expiryDays, isLowStock };
  }
  if (isLowStock) {
    return { tone: "warn", label: "Low Stock", expiryDays, isLowStock };
  }
  return { tone: "ok", label: "Healthy", expiryDays, isLowStock };
};

export const findTrackedMedicine = (items, medicineName) => {
  const target = String(medicineName || "").trim().toLowerCase();
  if (!target) {
    return null;
  }
  return (
    items.find((item) => String(item.name || "").trim().toLowerCase() === target) || null
  );
};
