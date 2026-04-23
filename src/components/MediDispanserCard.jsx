import { useState } from "react";
import api from "../api/axios";

const MediDispanserCard = () => {
  const [activeLed, setActiveLed] = useState(null);

  const sendLedCommand = async (color) => {
    try {
      setActiveLed(color);

      await api.post("/led-command", { color });

      setTimeout(() => {
        setActiveLed(null);
      }, 3000);
    } catch (error) {
      console.error(error);
      setActiveLed(null);
    }
  };

  const renderButton = (label, color, bgColor, hoverColor) => (
  <button
    type="button"
    onClick={() => sendLedCommand(color)}
    disabled={activeLed === color}
    className={`rounded-xl ${bgColor} px-4 py-2.5 font-semibold text-white shadow-md transition ${hoverColor} disabled:cursor-not-allowed disabled:opacity-60`}
  >
    {activeLed === color
      ? `${label.toUpperCase()} is Dispensing...`
      : label.toUpperCase()}
  </button>
);

  return (
    <div className="rounded-2xl border border-[#ead9c8] bg-white/85 p-4 shadow-md">
      <h3 className="mb-1 text-lg font-bold text-[#3d2c24]">
        Medicine Control Panel
      </h3>
      <p className="mb-4 text-sm text-[#6e5a50]">
        Trigger dispenser commands directly from the prescription workspace.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {renderButton("Paracetamol", "red", "bg-red-500", "hover:bg-red-600")}
        {renderButton("Cetrigen", "green", "bg-green-600", "hover:bg-green-700")}
        {/* {renderButton("blue", "bg-blue-600", "hover:bg-blue-700")} */}
        {/* {renderButton("off", "bg-slate-700", "hover:bg-slate-800")} */}
      </div>
    </div>
  );
};

export default MediDispanserCard;
