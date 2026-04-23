
const InputField = ({ label, type = "text", value, placeholder, onChange }) => {
  return (
    <div>
      <label className="block font-medium mb-1 text-slate-700">{label}</label>
      <input
        type={type}
        className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

export default InputField;
