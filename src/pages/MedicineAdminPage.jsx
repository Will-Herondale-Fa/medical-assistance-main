import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import MedicineAdminPanel from "../components/MedicineAdminPanel";
import {
  readMedicineAdminItems,
  writeMedicineAdminItems,
} from "../utils/medicineAdmin";
import {
  isMedicineAdminAuthenticated,
  setMedicineAdminAuthenticated,
} from "../utils/medicineAdminAuth";

export default function MedicineAdminPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(() =>
    isMedicineAdminAuthenticated()
  );
  const [items, setItems] = useState(() => readMedicineAdminItems());

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    writeMedicineAdminItems(items);
  }, [isAuthorized, items]);

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = () => {
    setMedicineAdminAuthenticated(false);
    setIsAuthorized(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_34%),linear-gradient(145deg,_#f5f9ff_0%,_#edf4ff_45%,_#f1fbff_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-2xl backdrop-blur-md md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Restricted Console
            </p>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
              Medicine Inventory Admin
            </h1>
          </div>

          <div className="flex gap-2">
            <Link to="/">
              <button
                type="button"
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Home
              </button>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        <MedicineAdminPanel items={items} onChange={setItems} />
      </div>
    </div>
  );
}
