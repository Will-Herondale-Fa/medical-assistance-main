import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, default: "" },
    dosage: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    patientName: { type: String, trim: true, required: true },
    doctorName: { type: String, trim: true, default: "" },
    age: { type: Number, min: 0 },
    sex: { type: String, enum: ["male", "female", "other"], default: "male" },
    temperature: { type: Number, min: 0 },
    pulse: { type: Number, min: 0 },
    spo2: { type: Number, min: 0, max: 100 },
    weight: { type: Number, min: 0 },
    bloodPressure: { type: String, trim: true, default: "" },
    allergies: { type: String, trim: true, default: "" },
    disabilities: { type: String, trim: true, default: "" },
    diagnosis: { type: String, trim: true, default: "" },
    medicines: { type: [medicineSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
