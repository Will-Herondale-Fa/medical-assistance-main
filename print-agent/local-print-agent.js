import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import PDFDocument from "pdfkit";
import { io } from "socket.io-client";
import pkg from 'pdf-to-printer';
const { print } = pkg;

const API_BASE_URL = process.env.PRINT_AGENT_API_BASE_URL || "http://localhost:4000/api";
const SOCKET_URL = process.env.PRINT_AGENT_SOCKET_URL || "http://localhost:4000";
const PRINT_AGENT_SECRET = String(process.env.PRINT_AGENT_SECRET || "").trim();

const PRINTER_NAME = process.env.PRINT_AGENT_PRINTER_NAME || undefined;
const OUT_DIR = path.join(os.tmpdir(), "medibot-print-agent");
const MACHINE_NAME = os.hostname();

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

let isPrinting = false;
let lastPrintedId = null;

const toText = (value, fallback = "-") => (value === undefined || value === null || value === "" ? fallback : String(value));

const buildPdf = async (patient, filePath) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const left = 40;
  const right = pageWidth - 40;
  const sheetTop = 40;
  const sheetWidth = right - left;
  const sheetHeight = 760;
  const colors = {
    ink: "#0b1324",
    muted: "#425466",
    line: "#d7e0ea",
    soft: "#f6fafe",
    brand: "#0a7f74",
    brandDark: "#085c63",
    accent: "#2f7cf6",
    brandBlue: "#2459af",
    tableBlue: "#e8f0fb",
    footer: "#607089",
  };

  const issuedAt = new Date(patient.createdAt || Date.now()).toLocaleString();
  const infoRows = [
    ["Patient Name", toText(patient.patientName)],
    ["Doctor Name", toText(patient.doctorName)],
    ["Age / Sex", `${toText(patient.age)} / ${toText(patient.sex)}`],
    ["Blood Pressure", toText(patient.bloodPressure)],
    ["Temperature", `${toText(patient.temperature)} C`],
    ["Pulse", `${toText(patient.pulse)} bpm`],
    ["SpO2", `${toText(patient.spo2)} %`],
    ["Weight", `${toText(patient.weight)} kg`],
    ["Allergies", toText(patient.allergies)],
    ["Disabilities", toText(patient.disabilities)],
  ];
  const meds = Array.isArray(patient.medicines) ? patient.medicines : [];
  const rows = meds.length ? meds : [{ name: "-", type: "-", dosage: "No medicines prescribed" }];

  doc.roundedRect(left, sheetTop, sheetWidth, sheetHeight, 18).fillAndStroke("#ffffff", "#dde6f0");
  doc.rect(left, sheetTop, sheetWidth, 10).fill(colors.brandDark);
  doc.rect(left + sheetWidth / 3, sheetTop, sheetWidth / 3, 10).fill(colors.brand);
  doc.rect(left + (sheetWidth * 2) / 3, sheetTop, sheetWidth / 3, 10).fill(colors.accent);

  const contentLeft = left + 28;
  const contentRight = right - 28;
  const contentWidth = contentRight - contentLeft;
  const headerTop = sheetTop + 26;

  doc.roundedRect(contentLeft, headerTop + 4, 48, 48, 12).fill(colors.brandDark);
  doc.circle(contentLeft + 24, headerTop + 28, 10).fillOpacity(0.2).fill("#ffffff").fillOpacity(1);
  doc
    .lineWidth(2.4)
    .strokeColor("#ffffff")
    .moveTo(contentLeft + 24, headerTop + 20)
    .lineTo(contentLeft + 24, headerTop + 36)
    .moveTo(contentLeft + 16, headerTop + 28)
    .lineTo(contentLeft + 32, headerTop + 28)
    .stroke();

  doc.font("Helvetica-Bold").fontSize(28).fillColor(colors.brandDark).text("Medibot", contentLeft + 60, headerTop, {
    width: 250,
  });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(colors.muted)
    .text("Doctor Prescription and Clinical Summary", contentLeft + 60, headerTop + 30, {
      width: 300,
    });

  const stampWidth = 180;
  const stampX = contentRight - stampWidth;
  doc
    .roundedRect(stampX, headerTop, 110, 28, 14)
    .fillAndStroke("#f1f6ff", "#b8d1f9");
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.brandBlue)
    .text("Official Copy", stampX, headerTop + 2, { width: 80, align: "center" });
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.ink)
    .text("Issued:", stampX, headerTop + 38, { continued: true });
  doc.font("Helvetica").fontSize(10).fillColor(colors.muted).text(` ${issuedAt}`);
  // doc
  //   .font("Helvetica-Bold")
  //   .fontSize(10)
  //   .fillColor(colors.ink)
  //   .text("Ref ID:", stampX, headerTop + 54, { continued: true });
  // doc.font("Helvetica").fontSize(10).fillColor(colors.muted).text(` ${toText(patient._id, "N/A")}`);

  doc.moveTo(contentLeft, headerTop + 76).lineTo(contentRight, headerTop + 76).lineWidth(2).strokeColor("#e7eef6").stroke();

  const sectionTitle = (title, y) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(colors.brandDark)
      .text(title.toUpperCase(), contentLeft, y, {
        characterSpacing: 1,
      });
  };

  sectionTitle("Patient & Clinical Details", headerTop + 96);

  const infoBoxTop = headerTop + 118;
  const infoBoxHeight = 154;
  doc.roundedRect(contentLeft, infoBoxTop, contentWidth, infoBoxHeight, 12).fillAndStroke(colors.soft, "#e4edf7");

  const leftColX = contentLeft + 16;
  const rightColX = contentLeft + contentWidth / 2 + 10;
  const infoLineHeight = 27;
  let currentY = infoBoxTop + 16;
  infoRows.forEach(([label, value], idx) => {
    const x = idx % 2 === 0 ? leftColX : rightColX;
    if (idx % 2 === 0 && idx > 0) {
      currentY += infoLineHeight;
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#32506d").text(label, x, currentY, {
      width: 124,
    });
    doc.font("Helvetica").fontSize(10).fillColor("#1a2b46").text(value, x + 128, currentY, {
      width: contentWidth / 2 - 150,
    });
  });

  const diagnosisTitleY = infoBoxTop + infoBoxHeight + 24;
  sectionTitle("Diagnosis", diagnosisTitleY);
  const diagnosisBoxTop = diagnosisTitleY + 22;
  const diagnosisBoxHeight = 60;
  doc
    .roundedRect(contentLeft, diagnosisBoxTop, contentWidth, diagnosisBoxHeight, 10)
    .lineWidth(1)
    .dash(4, { space: 3 })
    .strokeColor("#9ab2cb")
    .stroke()
    .undash();
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor("#23405f")
    .text(toText(patient.diagnosis, "No diagnosis notes provided."), contentLeft + 12, diagnosisBoxTop + 12, {
      width: contentWidth - 24,
    });

  const medsTitleY = diagnosisBoxTop + diagnosisBoxHeight + 26;
  sectionTitle("Prescribed Medicines", medsTitleY);
  const tableTop = medsTitleY + 22;
  const tableHeaderHeight = 28;
  const rowHeight = 30;
  const numberWidth = contentWidth * 0.08;
  const nameWidth = contentWidth * 0.44;
  const typeWidth = contentWidth * 0.2;
  const dosageWidth = contentWidth - numberWidth - nameWidth - typeWidth;
  const colX1 = contentLeft;
  const colX2 = colX1 + numberWidth;
  const colX3 = colX2 + nameWidth;
  const colX4 = colX3 + typeWidth;

  doc.rect(contentLeft, tableTop, contentWidth, tableHeaderHeight).fill(colors.tableBlue);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#163a6f")
    .text("#", colX1 + 10, tableTop + 9, { width: numberWidth - 12 })
    .text("Medicine Name", colX2 + 10, tableTop + 9, { width: nameWidth - 12 })
    .text("Type", colX3 + 10, tableTop + 9, { width: typeWidth - 12 })
    .text("Dosage Instructions", colX4 + 10, tableTop + 9, { width: dosageWidth - 12 });

  rows.slice(0, 10).forEach((m, index) => {
    const y = tableTop + tableHeaderHeight + rowHeight * index;
    if (index % 2 === 1) {
      doc.rect(contentLeft, y, contentWidth, rowHeight).fill("#f9fcff");
    }
    doc.rect(contentLeft, y, contentWidth, rowHeight).lineWidth(1).strokeColor(colors.line).stroke();
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(colors.ink)
      .text(String(index + 1), colX1 + 10, y + 9, { width: numberWidth - 12 })
      .text(toText(m.name), colX2 + 10, y + 9, { width: nameWidth - 12, ellipsis: true })
      .text(toText(m.type), colX3 + 10, y + 9, { width: typeWidth - 12, ellipsis: true })
      .text(toText(m.dosage), colX4 + 10, y + 9, { width: dosageWidth - 12, ellipsis: true });
  });

  const signatureTop = tableTop + tableHeaderHeight + rowHeight * Math.min(rows.length, 10) + 40;
  const signatureWidth = 240;
  const signatureX = contentRight - signatureWidth;
  doc.moveTo(signatureX, signatureTop).lineTo(contentRight, signatureTop).lineWidth(1).strokeColor("#486485").stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.ink)
    .text("Doctor Signature", signatureX, signatureTop + 8, {
      width: signatureWidth,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#5d748f")
    .text(toText(patient.doctorName, "Attending Doctor"), signatureX, signatureTop + 24, {
      width: signatureWidth,
      align: "center",
    });

  const footerTop = sheetTop + sheetHeight - 34;
  doc.moveTo(contentLeft, footerTop).lineTo(contentRight, footerTop).lineWidth(1).strokeColor("#e8edf4").stroke();
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(colors.footer)
    .text("This prescription is generated digitally from the patient dashboard.", contentLeft, footerTop + 10, {
      width: contentWidth,
      align: "center",
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

const fetchLatestPatient = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/latest`);
  if (!response.ok) {
    throw new Error(`Latest patient fetch failed with status ${response.status}`);
  }
  return response.json();
};

const printLatestPrescription = async (patientFromEvent) => {
  if (isPrinting) {
    console.log("[print-agent] Print is already in progress. Skipping duplicate trigger.");
    return;
  }

  isPrinting = true;
  let filePath = null;

  try {
    const latest = patientFromEvent || await fetchLatestPatient();
    if (!latest?._id) {
      console.log("[print-agent] No latest patient id found.");
      return;
    }

    if (latest._id === lastPrintedId) {
      console.log("[print-agent] Latest prescription already printed:", latest._id);
      return;
    }

    console.log("[print-agent] Latest patient details:", latest);

    const fileName = `prescription_${latest._id}_${Date.now()}.pdf`;
    filePath = path.join(OUT_DIR, fileName);

    await buildPdf(latest, filePath);
    await print(filePath, PRINTER_NAME ? { printer: PRINTER_NAME } : {});

    lastPrintedId = latest._id;
    console.log("[print-agent] Printed successfully:", filePath);
  } catch (error) {
    console.error("[print-agent] Print failed:", error.message);
  } finally {
    if (filePath) {
      fs.promises.unlink(filePath).catch(() => {});
    }
    isPrinting = false;
  }
};

if (!PRINT_AGENT_SECRET) {
  console.error("[print-agent] Missing PRINT_AGENT_SECRET. Exiting for security.");
  process.exit(1);
}

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  auth: {
    role: "print-agent",
    agentSecret: PRINT_AGENT_SECRET,
  },
});
let heartbeatInterval = null;

socket.on("connect", () => {
  console.log(`[print-agent] Connected to socket server: ${SOCKET_URL} (${socket.id})`);
  socket.emit("printAgentOnline", {
    machineName: MACHINE_NAME,
    printerName: PRINTER_NAME || "Default printer",
  });
  heartbeatInterval = setInterval(() => {
    socket.emit("printAgentHeartbeat", {
      machineName: MACHINE_NAME,
      printerName: PRINTER_NAME || "Default printer",
    });
  }, 15000);
});

socket.on("disconnect", () => {
  console.log("[print-agent] Socket disconnected.");
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
});

socket.on("connect_error", (error) => {
  console.error("[print-agent] Socket connection error:", error.message);
});

socket.on("printLatestPrescription", async (data) => {
  console.log("[print-agent] Received printLatestPrescription event.");
  await printLatestPrescription(data?.patient);
});

console.log("[print-agent] Running...");
console.log(`[print-agent] API base: ${API_BASE_URL}`);
console.log(`[print-agent] Socket url: ${SOCKET_URL}`);
if (PRINTER_NAME) {
  console.log(`[print-agent] Printer: ${PRINTER_NAME}`);
}
