
const InputField = ({ label, type = "text", value, placeholder, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#6e5a50]">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-xl border border-[#bfdbfe] bg-[#f8fbff] px-3 py-2.5 text-[#3d2c24] shadow-sm transition focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

export default InputField;
