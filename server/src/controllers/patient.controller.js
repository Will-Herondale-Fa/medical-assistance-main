import Patient from "../models/patient.model.js";
import SensorData from "../models/sensor.model.js";
import fs from "node:fs";
import path from "node:path";

const toNumber = (value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const createPatient = async (req, res) => {
  try {
    const {
      patientName,
      doctorName,
      age,
      sex,
      temperature,
      pulse,
      spo2,
      weight,
      bloodPressure,
      allergies,
      disabilities,
      diagnosis,
      medicines,
    } = req.body;

    if (!patientName?.trim()) {
      return res.status(400).json({ message: "patientName is required" });
    }

    const payload = {
      patientName: patientName.trim(),
      doctorName: doctorName?.trim() || "",
      age: toNumber(age),
      sex: sex || "male",
      temperature: toNumber(temperature),
      pulse: toNumber(pulse),
      spo2: toNumber(spo2),
      weight: toNumber(weight),
      bloodPressure: bloodPressure?.trim() || "",
      allergies: allergies?.trim() || "",
      disabilities: disabilities?.trim() || "",
      diagnosis: diagnosis?.trim() || "",
      medicines: Array.isArray(medicines)
        ? medicines
            .filter((med) => med?.name?.trim())
            .map((med) => ({
              name: med.name.trim(),
              type: med.type?.trim() || "",
              dosage: med.dosage?.trim() || "",
            }))
        : [],
    };

    if (payload.spo2 !== undefined && (payload.spo2 < 0 || payload.spo2 > 100)) {
      return res.status(400).json({ message: "spo2 must be between 0 and 100" });
    }

    const patient = await Patient.create(payload);

    // Persist a vitals snapshot only when a prescription/patient record is saved.
    const hasAnyVitals =
      payload.pulse !== undefined ||
      payload.temperature !== undefined ||
      payload.spo2 !== undefined ||
      payload.weight !== undefined;

    if (hasAnyVitals) {
      await SensorData.create({
        patientId: patient._id,
        patientName: payload.patientName,
        deviceId: "",
        source: "prescription",
        heartRate: payload.pulse,
        temperature: payload.temperature,
        spo2: payload.spo2,
        weight: payload.weight,
      });
    }

    return res.status(201).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLatestPatient = async (_req, res) => {
  try {
    const patient = await Patient.findOne().sort({ createdAt: -1 });

    if (!patient) {
      return res.status(404).json({ message: "No patient details found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLatestPatientPdf = async (_req, res) => {
  try {
    const patient = await Patient.findOne().sort({ createdAt: -1 });
    if (!patient) {
      return res.status(404).json({ message: "No patient details found" });
    }

    const outDir = path.join(process.cwd(), "server", "tmp", "prescriptions");
    ensureDir(outDir);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(outDir, `prescription_${ts}.pdf`);

    await buildPrescriptionPdf(patient, filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="prescription_${patient._id}.pdf"`
    );

    const stream = fs.createReadStream(filePath);
    stream.on("close", () => schedulePdfDelete(filePath, 10_000));
    stream.pipe(res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const schedulePdfDelete = (filePath, delayMs = 60_000) => {
  setTimeout(() => {
    fs.promises.unlink(filePath).catch(() => {});
  }, delayMs);
};

const buildPrescriptionPdf = async (patient, filePath) => {
  const pdfkitModule = await import("pdfkit");
  const PDFDocument = pdfkitModule.default || pdfkitModule;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const left = 40;
  const right = pageWidth - 40;
  const labelColor = "#1f2937";
  const muted = "#6b7280";
  const line = "#d1d5db";
  const brand = "#0b766e";

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(brand)
    .text("Medibot", left, 40);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(muted)
    .text("Doctor Prescription and Clinical Summary", left, 68);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(muted)
    .text(`Issued: ${new Date(patient.createdAt || Date.now()).toLocaleString()}`, right - 220, 48, {
      width: 220,
      align: "right",
    });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(muted)
    .text(`Ref ID: ${patient._id}`, right - 220, 64, { width: 220, align: "right" });

  doc.moveTo(left, 86).lineTo(right, 86).strokeColor(line).stroke();

  const infoTop = 104;
  const infoRows = [
    ["Patient Name", patient.patientName || "-"],
    ["Doctor Name", patient.doctorName || "-"],
    ["Age / Sex", `${patient.age ?? "-"} / ${patient.sex || "-"}`],
    ["Blood Pressure", patient.bloodPressure || "-"],
    ["Temperature", `${patient.temperature ?? "-"} C`],
    ["Pulse", `${patient.pulse ?? "-"} bpm`],
    ["SpO2", `${patient.spo2 ?? "-"} %`],
    ["Weight", `${patient.weight ?? "-"} kg`],
    ["Allergies", patient.allergies || "-"],
    ["Disabilities", patient.disabilities || "-"],
  ];

  doc.roundedRect(left, infoTop, right - left, 160, 8).strokeColor(line).stroke();
  let y = infoTop + 12;
  infoRows.forEach(([k, v], idx) => {
    const colX = idx % 2 === 0 ? left + 12 : left + (right - left) / 2 + 4;
    if (idx % 2 === 0 && idx > 0) {
      y += 24;
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(labelColor).text(`${k}:`, colX, y, { continued: true });
    doc.font("Helvetica").fontSize(10).fillColor("#111827").text(` ${v}`);
  });

  const diagnosisTop = infoTop + 176;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(labelColor).text("Diagnosis", left, diagnosisTop);
  doc.roundedRect(left, diagnosisTop + 16, right - left, 60, 6).strokeColor(line).stroke();
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(patient.diagnosis || "No diagnosis notes provided.", left + 10, diagnosisTop + 26, {
      width: right - left - 20,
    });

  const tableTop = diagnosisTop + 92;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(labelColor).text("Prescribed Medicines", left, tableTop);

  const headerTop = tableTop + 18;
  const tableWidth = right - left;
  const col1 = left;
  const col2 = left + tableWidth * 0.1;
  const col3 = left + tableWidth * 0.5;
  const col4 = left + tableWidth * 0.7;

  doc.rect(left, headerTop, tableWidth, 24).fill("#e8f3ff");
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#1e3a8a")
    .text("#", col1 + 8, headerTop + 7)
    .text("Medicine Name", col2 + 8, headerTop + 7)
    .text("Type", col3 + 8, headerTop + 7)
    .text("Dosage", col4 + 8, headerTop + 7);

  const meds = Array.isArray(patient.medicines) ? patient.medicines : [];
  const rows = meds.length ? meds : [{ name: "-", type: "-", dosage: "No medicines prescribed" }];
  let rowY = headerTop + 24;
  rows.slice(0, 10).forEach((m, i) => {
    doc.rect(left, rowY, tableWidth, 24).strokeColor(line).stroke();
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#111827")
      .text(String(i + 1), col1 + 8, rowY + 7)
      .text(m.name || "-", col2 + 8, rowY + 7, { width: col3 - col2 - 12, ellipsis: true })
      .text(m.type || "-", col3 + 8, rowY + 7, { width: col4 - col3 - 12, ellipsis: true })
      .text(m.dosage || "-", col4 + 8, rowY + 7, { width: right - col4 - 10, ellipsis: true });
    rowY += 24;
  });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(muted)
    .text(`Doctor Signature: ${patient.doctorName || "Attending Doctor"}`, right - 240, rowY + 24, {
      width: 240,
      align: "right",
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

export const printLatestPatient = async (_req, res) => {
  try {
    const patient = await Patient.findOne().sort({ createdAt: -1 });
    if (!patient) {
      return res.status(404).json({ message: "No patient details found" });
    }

    const outDir = path.join(process.cwd(), "server", "tmp", "prescriptions");
    ensureDir(outDir);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(outDir, `prescription_${ts}.pdf`);

    await buildPrescriptionPdf(patient, filePath);

    const printerModule = await import("pdf-to-printer");
    const printFn = printerModule.print || printerModule.default?.print;

    if (typeof printFn !== "function") {
      return res.status(500).json({ message: "Print module is not available" });
    }

    await printFn(filePath);
    // Better than pure cron: remove the file right after print finishes.
    schedulePdfDelete(filePath);

    return res.status(200).json({
      message: "Prescription sent to printer",
      filePath,
      patientId: patient._id,
    });
  } catch (error) {
    if (
      String(error?.message || "").includes("Cannot find package") ||
      String(error?.code || "") === "ERR_MODULE_NOT_FOUND"
    ) {
      return res.status(500).json({
        message:
          "Server print dependencies missing. Install: npm i pdfkit pdf-to-printer",
      });
    }
    return res.status(500).json({ message: error.message });
  }
};
