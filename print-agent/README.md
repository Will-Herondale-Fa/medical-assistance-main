# Medibot Local Print Agent

Run this on the machine that has the physical printer connected.  
It listens for `printLatestPrescription` socket events and prints the latest prescription locally without browser popup dialogs.

## Start

```bash
npm run print-agent
```

## Required environment variables

- `PRINT_AGENT_SECRET` (must match backend `PRINT_AGENT_SECRET`)

## Optional environment variables

- `PRINT_AGENT_API_BASE_URL` (default: `http://localhost:4000/api`)
- `PRINT_AGENT_SOCKET_URL` (default: `http://localhost:4000`)
- `PRINT_AGENT_PRINTER_NAME` (default: system default printer)

If backend is hosted on Render/Vercel/other cloud, point both URL vars to the backend domain.

Windows PowerShell example:

```powershell
$env:PRINT_AGENT_SECRET="same-secret-as-backend"
$env:PRINT_AGENT_API_BASE_URL="https://your-backend-url/api"
$env:PRINT_AGENT_SOCKET_URL="https://your-backend-url"
$env:PRINT_AGENT_PRINTER_NAME="HP LaserJet"
npm run print-agent
```
