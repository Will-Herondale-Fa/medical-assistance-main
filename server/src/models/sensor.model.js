import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
      default: "",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    source: {
      type: String,
      enum: ["live-stream", "prescription"],
      default: "live-stream",
      index: true,
    },
    heartRate: Number,
    temperature: Number,
    spo2: Number,
    weight: Number,
  },
  { timestamps: true }
);

export default mongoose.model("SensorData", sensorSchema);
