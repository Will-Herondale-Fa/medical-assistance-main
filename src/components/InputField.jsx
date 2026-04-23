
const InputField = ({ label, type = "text", value, placeholder, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#6e5a50]">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-xl border border-[#e3cfbb] bg-[#fffaf4] px-3 py-2.5 text-[#3d2c24] shadow-sm transition focus:border-[#2f8f83] focus:outline-none focus:ring-2 focus:ring-[#2f8f83]"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

export default InputField;
