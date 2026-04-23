import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("patient");

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-blue-50 via-teal-50 to-emerald-100 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white/80 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="inline-block animate-bounce">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="7" width="18" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v2m0-8v2" />
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight animate-fade-in">MediAssist</h1>
        </div>
        <button className="px-5 py-2 bg-linear-to-r from-blue-600 to-teal-500 text-white rounded-lg shadow hover:scale-105 transition-transform duration-200">
          Contact Support
        </button>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center grow px-6 text-center animate-fade-in">
        <div className="mb-6 animate-slide-down">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 max-w-3xl leading-tight drop-shadow-lg">
            Your Smart Medical Assistance Platform
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl text-lg">
            Seamlessly connect patients with certified doctors.<br />
            <span className="text-blue-500 font-semibold">Fast consultations.</span> <span className="text-teal-500 font-semibold">Secure communication.</span> <span className="text-emerald-500 font-semibold">Better healthcare.</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 w-full max-w-xl animate-fade-in">
          <div className="flex bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 py-3 font-medium transition-all duration-200 text-lg flex items-center justify-center gap-2 ${
                activeTab === "patient"
                  ? "bg-blue-600 text-white shadow-inner scale-105"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                </svg>
              </span>
              I am a Patient
            </button>
            <button
              onClick={() => setActiveTab("doctor")}
              className={`flex-1 py-3 font-medium transition-all duration-200 text-lg flex items-center justify-center gap-2 ${
                activeTab === "doctor"
                  ? "bg-teal-600 text-white shadow-inner scale-105"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="7" y="7" width="10" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4" />
                </svg>
              </span>
              I am a Doctor
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-8 bg-white p-8 rounded-xl shadow-xl animate-fade-in">
            {activeTab === "patient" ? (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Get Medical Help Instantly
                </h3>
                <ul className="mt-4 text-gray-600 space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Book appointments with specialists</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Chat or video consult doctors</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Secure medical history storage</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Prescription management</li>
                </ul>

                <Link to="/patientdashboard">
                  <button className="mt-6 w-full bg-linear-to-r from-blue-600 to-teal-500 text-white py-3 rounded-lg hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Patient
                  </button>
                </Link>
              </div>
            ) : (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Expand Your Practice Digitally
                </h3>
                <ul className="mt-4 text-gray-600 space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Manage appointments efficiently</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Conduct secure online consultations</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Access patient medical records</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Digital prescription system</li>
                </ul>
                <Link to="/doctorlogin">
                  <button className="mt-6 w-full bg-linear-to-r from-teal-600 to-blue-500 text-white py-3 rounded-lg hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Doctor
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm animate-fade-in">
        © {new Date().getFullYear()} MediAssist. All rights reserved.
      </footer>
    </div>
  );

}
