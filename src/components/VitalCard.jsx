
const VitalCard = ({ title, value, icon, onAdd, added = false }) => {
  return (
    <div className="bg-white/95 border border-slate-200 p-6 rounded-2xl shadow-md text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg">
      <div className="flex justify-center mb-2">{icon}</div>
      <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
      <p className="text-2xl font-bold mt-2 text-slate-900 animate-fade-in">{value}</p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={`mt-4 inline-flex items-center justify-center gap-1.5 text-white text-sm px-4 py-1.5 rounded-md transition ${
            added ? "bg-emerald-600 hover:bg-emerald-600" : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          {added ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added
            </>
          ) : (
            "Add to Prescription"
          )}
        </button>
      )}
    </div>
  );
}

export default VitalCard;
