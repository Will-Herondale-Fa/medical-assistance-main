# Medical Assistance

Medical Assistance is a React + Node.js app for clinic workflows:
- Real-time vitals feed
- Doctor dashboard and patient view
- Prescription generation and print-agent integration
- Secure doctor auth
- Multi-platform consultation sessions (Jitsi, Google Meet, Zoom, Teams, custom HTTPS link)

## Core Features

- Live sensor updates via Socket.IO
- Protected doctor actions (auth-required APIs and socket role auth)
- Prescription PDF generation and optional local auto-print agent
- Consultation session management with platform validation
- Optional in-app Jitsi patient embed mode
- Sensor stream is cached live; DB vitals snapshots are persisted on prescription save

## Backend Environment Variables

You can now run without setting these manually because built-in defaults are applied:

- `DOCTOR_EMAIL` (default: `doctor@medibot.com`)
- `DOCTOR_PASSWORD` (default: `doctor123`)
- `DOCTOR_AUTH_SECRET` (default included)
- `SENSOR_INGEST_SECRET` (default included)
- `PRINT_AGENT_SECRET` (default included)
- `MONGO_URI` (if provided, it is used as-is and takes priority over defaults)

Use [server/.env.example](server/.env.example) if you want to override.

`PERSIST_SENSOR_STREAM=true` can be enabled if you want every incoming sensor sample stored in MongoDB.

## Frontend Environment Variables

Use [.env.example](.env.example) for frontend configuration.

- `VITE_API_BASE_URL` (example: `https://your-api-domain.onrender.com/api`)
- `VITE_SOCKET_URL` (example: `https://your-api-domain.onrender.com`)

If these are omitted in production, frontend defaults to same-origin behavior.

## Local Development

1. Install dependencies:
```bash
npm install
npm --prefix server install
npm --prefix print-agent install
```

2. Configure env files:
- Create `server/.env` from `server/.env.example`
- Optionally create root `.env` from `.env.example`

3. Start frontend and backend:
```bash
npm run dev
npm run server
```

4. (Optional) Start print agent on a machine with printer access:
```bash
npm run print-agent
```

## Deployment (Render Recommended)

This repo includes [render.yaml](render.yaml) for Blueprint deployment.

1. Push this repo to GitHub.
2. In Render: **New +** -> **Blueprint** -> select this repository.
3. Render will create:
- `medical-assistance-api` (Node web service)
- `medical-assistance-web` (Static site)
4. Backend env vars are optional now due to defaults, but recommended to set your own values:
- `MONGO_URI`
- `DOCTOR_EMAIL`
- `DOCTOR_PASSWORD`
- `DOCTOR_AUTH_SECRET`
- `SENSOR_INGEST_SECRET`
- `PRINT_AGENT_SECRET`
- `CORS_ORIGINS` (frontend URL, comma-separated if multiple)
- `FRONTEND_URL` (optional explicit frontend URL)
5. Set frontend env vars:
- `VITE_API_BASE_URL=https://<api-domain>/api`
- `VITE_SOCKET_URL=https://<api-domain>`

## Vercel + Render Split (Alternative)

- Deploy frontend on Vercel
- Deploy backend on Render
- Configure:
  - `VITE_API_BASE_URL` and `VITE_SOCKET_URL` on Vercel
  - `CORS_ORIGINS` on Render backend to include the Vercel frontend URL

## Health Check

- Backend health endpoint: `GET /api/health`

## Repo

- GitHub: `https://github.com/Will-Herondale-Fa/medical-assistance-main`
