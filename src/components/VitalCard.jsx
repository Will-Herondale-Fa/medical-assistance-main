
const VitalCard = ({ title, value, icon, onAdd, added = false }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[#dbeafe] bg-white/92 p-6 text-center shadow-[0_16px_40px_rgba(145,90,55,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_46px_rgba(100,70,45,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#c6775f] via-[#2563eb] to-[#0f766e] opacity-90" />
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#9a4f38] ring-1 ring-[#edd5c2]">
        {icon}
      </div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</h4>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
            added
              ? "bg-[#0f766e] hover:bg-[#0f766e]"
              : "bg-gradient-to-r from-[#2563eb] to-[#0f766e] hover:brightness-95"
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
