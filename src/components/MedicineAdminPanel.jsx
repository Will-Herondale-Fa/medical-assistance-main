import { useMemo, useState } from "react";
import {
  getMedicineStatus,
  normalizeMedicineAdminItem,
} from "../utils/medicineAdmin";

const STATUS_CLASS = {
  danger: "bg-rose-100 text-rose-700 border-rose-200",
  warn: "bg-amber-100 text-amber-700 border-amber-200",
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function MedicineAdminPanel({
  items,
  onChange,
}) {
  const [draft, setDraft] = useState({
    name: "",
    batchNo: "",
    expiryDate: "",
    stockQty: 0,
    lowStockThreshold: 10,
    notes: "",
  });

  const alerts = useMemo(
    () =>
      items
        .map((item) => ({ item, status: getMedicineStatus(item) }))
        .filter(({ status }) => status.tone !== "ok"),
    [items]
  );

  const addItem = () => {
    if (!String(draft.name || "").trim()) {
      return;
    }
    onChange([...items, normalizeMedicineAdminItem(draft)]);
    setDraft({
      name: "",
      batchNo: "",
      expiryDate: "",
      stockQty: 0,
      lowStockThreshold: 10,
      notes: "",
    });
  };

  const removeItem = (id) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-md">
      <h3 className="text-lg font-bold text-slate-900">Medicine Admin Panel</h3>
      <p className="mb-3 text-sm text-slate-600">
        Track expiry and stock so prescriptions surface risk alerts.
      </p>

      {alerts.length > 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {alerts.map(({ item, status }) => (
            <p key={item.id}>
              {item.name}: {status.label}
            </p>
          ))}
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          No expiry or stock alerts right now.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="Medicine name"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
        <input
          type="text"
          placeholder="Batch no"
          value={draft.batchNo}
          onChange={(e) => setDraft((prev) => ({ ...prev, batchNo: e.target.value }))}
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
        <input
          type="date"
          value={draft.expiryDate}
          onChange={(e) => setDraft((prev) => ({ ...prev, expiryDate: e.target.value }))}
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
        <input
          type="number"
          placeholder="Stock qty"
          value={draft.stockQty}
          onChange={(e) => setDraft((prev) => ({ ...prev, stockQty: Number(e.target.value || 0) }))}
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
        <input
          type="number"
          placeholder="Low stock threshold"
          value={draft.lowStockThreshold}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value || 0) }))
          }
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={draft.notes}
          onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          className="rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={addItem}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add / Update Item
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const status = getMedicineStatus(item);
          return (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Batch {item.batchNo || "-"} | Exp: {item.expiryDate || "-"} | Stock:{" "}
                  {item.stockQty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    STATUS_CLASS[status.tone]
                  }`}
                >
                  {status.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
