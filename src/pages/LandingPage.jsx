import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("patient");

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_10%_10%,_rgba(47,143,131,0.16),_transparent_35%),radial-gradient(circle_at_85%_15%,_rgba(180,91,63,0.18),_transparent_33%),linear-gradient(150deg,_#fff8ef_0%,_#f8f2e8_40%,_#f5efe6_100%)] animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white/70 shadow-lg backdrop-blur-md border-b border-amber-100">
        <div className="flex items-center gap-3">
          <span className="inline-block animate-bounce">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="7" width="18" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v2m0-8v2" />
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-[#7f3f2d] tracking-tight animate-fade-in">MediAssist</h1>
        </div>
        <span className="rounded-full border border-[#e4cdb7] bg-[#fff3e7] px-4 py-2 text-sm font-semibold text-[#8b4a35]">
          System Online
        </span>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center grow px-6 text-center animate-fade-in">
        <div className="mb-6 animate-slide-down">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#3d2c24] max-w-3xl leading-tight drop-shadow-lg">
            Your Smart Medical Assistance Platform
          </h2>
          <p className="mt-4 text-[#6e5a50] max-w-2xl text-lg">
            Seamlessly connect patients with certified doctors.<br />
            <span className="text-[#b45b3f] font-semibold">Fast consultations.</span> <span className="text-[#2f8f83] font-semibold">Secure communication.</span> <span className="text-[#a17a46] font-semibold">Better healthcare.</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 w-full max-w-xl animate-fade-in">
          <div className="flex bg-white/90 rounded-xl shadow-xl overflow-hidden border border-[#ead9c8]">
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 py-3 font-medium transition-all duration-200 text-lg flex items-center justify-center gap-2 ${
                activeTab === "patient"
                  ? "bg-[#b45b3f] text-white shadow-inner scale-105"
                  : "text-[#6e5a50] hover:bg-[#f8efe3]"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-[#d3876f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  ? "bg-[#2f8f83] text-white shadow-inner scale-105"
                  : "text-[#6e5a50] hover:bg-[#f8efe3]"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-[#4ca79b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="7" y="7" width="10" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4" />
                </svg>
              </span>
              I am a Doctor
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-8 bg-white/92 p-8 rounded-2xl shadow-2xl border border-[#ead9c8] animate-fade-in">
            {activeTab === "patient" ? (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-[#3d2c24] flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-[#b45b3f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Get Medical Help Instantly
                </h3>
                <ul className="mt-4 text-[#6e5a50] space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Book appointments with specialists</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Chat or video consult doctors</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Secure medical history storage</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Prescription management</li>
                </ul>

                <Link to="/patientdashboard">
                  <button className="mt-6 w-full bg-gradient-to-r from-[#b45b3f] to-[#2f8f83] text-white py-3 rounded-xl hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Patient
                  </button>
                </Link>
              </div>
            ) : (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-[#3d2c24] flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-[#2f8f83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Expand Your Practice Digitally
                </h3>
                <ul className="mt-4 text-[#6e5a50] space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Manage appointments efficiently</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Conduct secure online consultations</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Access patient medical records</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Digital prescription system</li>
                </ul>
                <Link to="/doctorlogin">
                  <button className="mt-6 w-full bg-gradient-to-r from-[#2f8f83] to-[#b45b3f] text-white py-3 rounded-xl hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Doctor
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-[#7b675c] text-sm animate-fade-in">
        © {new Date().getFullYear()} MediAssist. All rights reserved.
      </footer>
    </div>
  );

}
