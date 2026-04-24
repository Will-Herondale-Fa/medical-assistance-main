// import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorLogin from "./pages/DoctorLogin";
import MedicineAdminPage from "./pages/MedicineAdminPage";
import ProtectedDoctorRoute from "./components/ProtectedDoctorRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patientdashboard" element={<PatientDashboard />} />
        <Route path="/doctorlogin" element={<DoctorLogin />} />
        <Route
          path="/_sys/med-admin-console-7x9"
          element={<MedicineAdminPage />}
        />
        <Route
          path="/doctordashboard"
          element={
            <ProtectedDoctorRoute>
              <DoctorDashboard />
            </ProtectedDoctorRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
