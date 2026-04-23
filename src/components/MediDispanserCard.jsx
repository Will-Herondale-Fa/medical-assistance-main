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
    className={`${bgColor} text-white px-4 py-2 rounded-lg ${hoverColor} disabled:opacity-60 disabled:cursor-not-allowed`}
  >
    {activeLed === color
      ? `${label.toUpperCase()} is Dispensing...`
      : label.toUpperCase()}
  </button>
);

  return (
    <div className="pt-2">
      <h3 className="font-semibold text-lg text-slate-900 mb-3">
        Medicine Control Panel
      </h3>

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