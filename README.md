# medical assistance

medical assistance is a Node.js-based backend and REactJS web application for managing patient vitals, generating prescriptions, and providing a real-time dashboard for doctors. It is designed for clinics or healthcare providers to streamline patient data collection and prescription management.

## Required backend environment variables

The backend now fails fast on startup if any of these are missing:

- `DOCTOR_EMAIL`
- `DOCTOR_PASSWORD`
- `DOCTOR_AUTH_SECRET`
- `SENSOR_INGEST_SECRET`
- `PRINT_AGENT_SECRET`

Use [server/.env.example](server/.env.example) as the template.

## Deployment notes (Vercel / Render)

- Render is recommended for the Node backend because this app uses long-lived Socket.IO and raw WebSocket connections.
- Vercel works well for the React frontend build.
- When frontend and backend are on different domains, set frontend env vars from [.env.example](.env.example):
   - `VITE_API_BASE_URL=https://your-backend-domain/api`
   - `VITE_SOCKET_URL=https://your-backend-domain`
- On the backend, set `CORS_ORIGINS` to frontend URL(s), comma-separated.

## Features

- **Patient Vitals API**: Receives and stores patient vitals (temperature, pulse, weight) via REST API.
- **Real-Time Dashboard**: Uses Socket.IO to broadcast new data to connected clients instantly.
- **Prescription Generation**: Generates professional PDF prescriptions with patient and doctor details, vitals, diagnosis, and medications.
- **Multi-Platform Consultation**: Supports Jitsi Meet (including in-app patient embed), Google Meet, Zoom, Teams, and custom secure call links.
- **Static Web Frontend**: Includes multiple HTML pages for login, dashboard, patient details, and more.
- **History Tracking**: Maintains a history of the latest 500 vitals entries.
- **CORS Enabled**: Allows cross-origin requests for easy integration.

## Consultation Platforms

- Doctors can publish consultation sessions from the dashboard using:
  - Jitsi Meet (with optional in-app patient embed mode)
  - Google Meet
  - Zoom
  - Microsoft Teams
  - Any custom HTTPS call link
- Patients automatically receive live updates over Socket.IO and can join in one tap.

## Render Deployment (Recommended)

This repo includes [render.yaml](render.yaml) for one-click blueprint deployment.

1. Push this repository to GitHub.
2. In Render, use **New +** -> **Blueprint** and select this repository.
3. Create both services from `render.yaml`:
   - `medical-assistance-api` (Node web service)
   - `medical-assistance-web` (static frontend)
4. Set environment variables on the backend service:
   - `MONGO_URI`
   - `DOCTOR_EMAIL`
   - `DOCTOR_PASSWORD`
   - `DOCTOR_AUTH_SECRET`
   - `SENSOR_INGEST_SECRET`
   - `PRINT_AGENT_SECRET`
   - `CORS_ORIGINS` (set to your frontend URL)
   - `FRONTEND_URL` (same frontend URL)
5. Set environment variables on the frontend service:
   - `VITE_API_BASE_URL` = `https://<your-api-domain>/api`
   - `VITE_SOCKET_URL` = `https://<your-api-domain>`

## Project Structure
my-app/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│
├── src/
│   │
│   ├── app/                     # App-level setup (root config)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── routes.tsx
│   │   ├── providers.tsx        # Context/Redux/Query providers
│   │   └── store.ts             # Redux store (if using)
│   │
│   ├── features/                # Feature-based modules (🔥 scalable)
│   │   ├── auth/
│   │   │   ├── api.ts
│   │   │   ├── authSlice.ts
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/
│   │   └── users/
│   │
│   ├── components/              # Shared reusable UI components
│   │   ├── ui/                  # Button, Input, Modal, etc.
│   │   ├── layout/              # Navbar, Sidebar, Footer
│   │   └── common/              # Generic shared pieces
│   │
│   ├── hooks/                   # Global reusable hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   │
│   ├── services/                # API layer (axios/fetch config)
│   │   ├── apiClient.ts
│   │   ├── interceptors.ts
│   │   └── endpoints.ts
│   │
│   ├── lib/                     # 3rd-party configs
│   │   ├── axios.ts
│   │   ├── react-query.ts
│   │   └── i18n.ts
│   │
│   ├── utils/                   # Pure utility functions
│   │   ├── formatDate.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── types/                   # Global TypeScript types
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── .env
├── .env.production
├── tsconfig.json
├── vite.config.ts / webpack.config.js
└── package.json

## API Endpoints

### POST `/api/data`
- **Description**: Submit patient vitals.
- **Headers**: `x-api-key: <API_KEY>`
- **Body**:
  ```json
  {
    "temperature_c": 36.5,
    "pulse_bpm": 80,
    "weight_kg": 70,
    "ts": "2026-02-27T10:00:00Z"
  }
  ```
- **Response**: `{ status: 'success' }`

### GET `/api/latest`
- **Description**: Get the latest vitals data.
- **Response**: Latest data object.

### GET `/api/history`
- **Description**: Get the history of vitals (up to 500 entries).
- **Response**: `{ items: [ ... ] }`

### POST `/api/prescriptions`
- **Description**: Generate a PDF prescription for a patient.
- **Body**: Patient, doctor, diagnosis, and medication details.
- **Response**: `{ status: 'success', url: '/prescriptions/<file>.pdf' }`

## How It Works

1. **Data Submission**: Devices or clients post vitals to `/api/data` with an API key.
2. **Real-Time Updates**: All connected dashboards receive new data instantly via Socket.IO.
3. **Prescription Generation**: Doctors can generate and download PDF prescriptions for patients.

## Setup & Usage

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the server**:
   ```bash
   node server.js
   ```
3. **Access the dashboard**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

- **API Key**: Set `API_KEY` in environment variables for secure data submission (default: `dev-secret-key`).
- **Port**: Set `PORT` in environment variables (default: `3000`).

## Dependencies
- express
- socket.io
- cors
- pdfkit
- pdf-to-printer

## License

MIT License
