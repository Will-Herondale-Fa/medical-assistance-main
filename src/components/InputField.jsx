
const InputField = ({ label, type = "text", value, placeholder, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

export default InputField;
