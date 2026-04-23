import fs from "node:fs";
import path from "node:path";

const PRESCRIPTIONS_DIR = path.join(process.cwd(), "server", "tmp", "prescriptions");
const ONE_HOUR_MS = 60 * 60 * 1000;

export const cleanupPrescriptionPdfs = async () => {
  try {
    if (!fs.existsSync(PRESCRIPTIONS_DIR)) {
      return;
    }

    const files = await fs.promises.readdir(PRESCRIPTIONS_DIR);
    const pdfFiles = files.filter((name) => name.toLowerCase().endsWith(".pdf"));

    await Promise.all(
      pdfFiles.map(async (name) => {
        const fullPath = path.join(PRESCRIPTIONS_DIR, name);
        try {
          await fs.promises.unlink(fullPath);
        } catch {
          // Ignore locked/missing files; they will be retried in next cycle.
        }
      })
    );
  } catch (error) {
    console.error("Prescription cleanup job failed:", error.message);
  }
};

export const startPrescriptionCleanupJob = () => {
  setInterval(() => {
    cleanupPrescriptionPdfs();
  }, ONE_HOUR_MS);
};
