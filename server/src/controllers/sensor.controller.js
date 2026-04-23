import SensorData from "../models/sensor.model.js";

const toNumber = (value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const saveSensorData = async (req, res) => {
  try {
    const payload = {
      deviceId: req.body.deviceId?.toString().trim() || "",
      patientName: req.body.patientName?.toString().trim() || "",
      patientId: req.body.patientId || undefined,
      heartRate: toNumber(req.body.heartRate),
      temperature: toNumber(req.body.temperature),
      spo2: toNumber(req.body.spo2),
      weight: toNumber(req.body.weight),
    };

    if (
      payload.heartRate === undefined &&
      payload.temperature === undefined &&
      payload.spo2 === undefined &&
      payload.weight === undefined
    ) {
      return res.status(400).json({
        message: "At least one sensor value is required (heartRate, temperature, spo2, weight)",
      });
    }

    const data = await SensorData.create(payload);

    const io = req.app.get("io");
    if (io) {
      io.to("role:doctor").emit("sensorUpdate", data);
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLatestSensorData = async (_req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ createdAt: -1 });
    return res.status(200).json(latest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
