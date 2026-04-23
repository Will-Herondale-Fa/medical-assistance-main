const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const printPrescriptionPdf = (details) => {
  if (!details) {
    return false;
  }

  const medicines = Array.isArray(details.medicines) ? details.medicines : [];
  const issuedAt = details.createdAt
    ? new Date(details.createdAt).toLocaleString()
    : new Date().toLocaleString();

  const medicinesRows = medicines.length
    ? medicines
        .map(
          (med, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(med.name || "-")}</td>
              <td>${escapeHtml(med.type || "-")}</td>
              <td>${escapeHtml(med.dosage || "-")}</td>
            </tr>
          `
        )
        .join("")
    : `
      <tr>
        <td colspan="4" style="text-align:center;">No medicines prescribed</td>
      </tr>
    `;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Medibot Prescription</title>
        <style>
          :root {
            --ink: #0b1324;
            --muted: #425466;
            --line: #d7e0ea;
            --soft: #f6fafe;
            --brand: #0a7f74;
            --brand-dark: #085c63;
            --accent: #2f7cf6;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Segoe UI", "Calibri", Arial, sans-serif;
            color: var(--ink);
            background: #ecf2fb;
            padding: 28px;
          }
          .sheet {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #dde6f0;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
          }
          .topbar {
            height: 10px;
            background: linear-gradient(90deg, var(--brand-dark), var(--brand), var(--accent));
          }
          .content { padding: 26px 28px 24px; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #e7eef6;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--brand-dark), var(--brand));
            display: grid;
            place-items: center;
            box-shadow: 0 8px 16px rgba(10, 127, 116, 0.25);
          }
          .title {
            margin: 0;
            font-size: 30px;
            line-height: 1;
            letter-spacing: 0.5px;
            color: var(--brand-dark);
          }
          .subtitle {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: 13px;
            letter-spacing: 0.2px;
          }
          .stamp {
            text-align: right;
            font-size: 12px;
            color: var(--muted);
          }
          .badge {
            display: inline-block;
            border: 1px solid #b8d1f9;
            background: #f1f6ff;
            color: #2459af;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 999px;
            margin-bottom: 8px;
          }
          .ref {
            margin-top: 4px;
            font-size: 11px;
            color: #607089;
          }
          .section { margin-top: 18px; }
          .section h3 {
            margin: 0 0 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-dark);
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 20px;
            background: var(--soft);
            border: 1px solid #e4edf7;
            border-radius: 12px;
            padding: 15px 16px;
          }
          .row {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #1a2b46;
          }
          .label {
            display: inline-block;
            min-width: 124px;
            color: #32506d;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 14px;
          }
          th, td {
            border: 1px solid var(--line);
            padding: 11px 12px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #e8f0fb;
            color: #163a6f;
            font-weight: 700;
          }
          tr:nth-child(even) td { background: #f9fcff; }
          .note-box {
            margin-top: 12px;
            border: 1px dashed #9ab2cb;
            border-radius: 10px;
            padding: 11px 12px;
            font-size: 13px;
            color: #23405f;
            min-height: 56px;
            background: #fcfeff;
          }
          .signature {
            margin-top: 36px;
            display: flex;
            justify-content: flex-end;
          }
          .signature-box {
            min-width: 240px;
            text-align: center;
          }
          .line {
            border-top: 1px solid #486485;
            margin-bottom: 6px;
          }
          .small { font-size: 12px; color: #5d748f; }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e8edf4;
            font-size: 11px;
            color: #607089;
            text-align: center;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .sheet {
              box-shadow: none;
              border: 0;
              border-radius: 0;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="topbar"></div>
          <div class="content">
            <div class="header">
              <div class="brand">
                <div class="logo" aria-label="Medibot logo">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)" />
                    <path d="M12 6V18M6 12H18" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h1 class="title">Medibot</h1>
                  <p class="subtitle">Doctor Prescription and Clinical Summary</p>
                </div>
              </div>
              <div class="stamp">
                <div class="badge">Official Copy</div>
                <div><strong>Issued:</strong> ${escapeHtml(issuedAt)}</div>
                <div class="ref"><strong>Ref ID:</strong> ${escapeHtml(details._id || "N/A")}</div>
              </div>
            </div>

            <div class="section">
              <h3>Patient & Clinical Details</h3>
              <div class="grid">
                <p class="row"><span class="label">Patient Name</span>${escapeHtml(details.patientName || "-")}</p>
                <p class="row"><span class="label">Doctor Name</span>${escapeHtml(details.doctorName || "-")}</p>
                <p class="row"><span class="label">Age / Sex</span>${escapeHtml(details.age ?? "-")} / ${escapeHtml(details.sex || "-")}</p>
                <p class="row"><span class="label">Blood Pressure</span>${escapeHtml(details.bloodPressure || "-")}</p>
                <p class="row"><span class="label">Temperature</span>${escapeHtml(details.temperature ?? "-")} C</p>
                <p class="row"><span class="label">Pulse</span>${escapeHtml(details.pulse ?? "-")} bpm</p>
                <p class="row"><span class="label">SpO2</span>${escapeHtml(details.spo2 ?? "-")} %</p>
                <p class="row"><span class="label">Weight</span>${escapeHtml(details.weight ?? "-")} kg</p>
                <p class="row"><span class="label">Allergies</span>${escapeHtml(details.allergies || "-")}</p>
                <p class="row"><span class="label">Disabilities</span>${escapeHtml(details.disabilities || "-")}</p>
              </div>
            </div>

            <div class="section">
              <h3>Diagnosis</h3>
              <div class="note-box">${escapeHtml(details.diagnosis || "No diagnosis notes provided.")}</div>
            </div>

            <div class="section">
              <h3>Prescribed Medicines</h3>
              <table>
                <thead>
                  <tr>
                    <th style="width:8%;">#</th>
                    <th style="width:44%;">Medicine Name</th>
                    <th style="width:20%;">Type</th>
                    <th style="width:28%;">Dosage Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medicinesRows}
                </tbody>
              </table>
            </div>

            <div class="signature">
              <div class="signature-box">
                <div class="line"></div>
                <div><strong>Doctor Signature</strong></div>
                <div class="small">${escapeHtml(details.doctorName || "Attending Doctor")}</div>
              </div>
            </div>

            <div class="footer">
              This prescription is generated digitally from the patient dashboard.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return false;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);

  return true;
};
