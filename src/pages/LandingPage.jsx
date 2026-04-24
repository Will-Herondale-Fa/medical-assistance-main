import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("patient");
  const [espStatus, setEspStatus] = useState({ online: false, deviceId: "", lastSeenAt: "" });

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/sensors/latest");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!mounted) {
          return;
        }
        if (data?.createdAt) {
          const ageMs = Date.now() - new Date(data.createdAt).getTime();
          setEspStatus({
            online: ageMs <= 45_000,
            deviceId: data.deviceId || "",
            lastSeenAt: data.createdAt,
          });
        } else {
          setEspStatus((prev) => ({ ...prev, online: false }));
        }
      } catch {
        if (mounted) {
          setEspStatus((prev) => ({ ...prev, online: false }));
        }
      }
    };

    checkStatus();
    const timer = setInterval(checkStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_12%_10%,_rgba(37,99,235,0.18),_transparent_34%),radial-gradient(circle_at_85%_14%,_rgba(15,118,110,0.2),_transparent_32%),linear-gradient(150deg,_#f4f8ff_0%,_#ecf4ff_42%,_#f1f9ff_100%)] animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white/75 shadow-lg backdrop-blur-md border-b border-blue-100">
        <div className="flex items-center gap-3">
          <span className="inline-block animate-bounce">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="7" width="18" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v2m0-8v2" />
            </svg>
          </span>
          <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight animate-fade-in">Medibot</h1>
        </div>
        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            espStatus.online
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {espStatus.online ? "ESP32 Online" : "ESP32 Offline"}
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center grow px-6 text-center animate-fade-in">
        <div className="mb-6 animate-slide-down">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 max-w-3xl leading-tight drop-shadow-lg">
            Your Smart Medibot Care Platform
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl text-lg">
            Seamlessly connect patients with certified doctors.<br />
            <span className="text-blue-600 font-semibold">Fast consultations.</span> <span className="text-teal-600 font-semibold">Secure communication.</span> <span className="text-sky-600 font-semibold">Better healthcare.</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 w-full max-w-xl animate-fade-in">
          <div className="flex bg-white/90 rounded-xl shadow-xl overflow-hidden border border-blue-100">
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 py-3 font-medium transition-all duration-200 text-lg flex items-center justify-center gap-2 ${
                activeTab === "patient"
                  ? "bg-blue-600 text-white shadow-inner scale-105"
                  : "text-slate-600 hover:bg-blue-50"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  : "text-slate-600 hover:bg-teal-50"
              }`}
            >
              <span className="inline-block animate-pulse">
                <svg className="w-6 h-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="7" y="7" width="10" height="10" rx="5" strokeWidth="2" stroke="currentColor" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4" />
                </svg>
              </span>
              I am a Doctor
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-8 bg-white/92 p-8 rounded-2xl shadow-2xl border border-blue-100 animate-fade-in">
            {activeTab === "patient" ? (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Get Medical Help Instantly
                </h3>
                <ul className="mt-4 text-slate-600 space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Book appointments with specialists</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Chat or video consult doctors</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Secure medical history storage</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Prescription management</li>
                </ul>

                <Link to="/patientdashboard">
                  <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-xl hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Patient
                  </button>
                </Link>
              </div>
            ) : (
              <div className="animate-slide-up">
                <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-block animate-bounce">
                    <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Expand Your Practice Digitally
                </h3>
                <ul className="mt-4 text-slate-600 space-y-2 text-left">
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Manage appointments efficiently</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Conduct secure online consultations</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Access patient medical records</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✔</span> Digital prescription system</li>
                </ul>
                <Link to="/doctorlogin">
                  <button className="mt-6 w-full bg-gradient-to-r from-teal-600 to-blue-500 text-white py-3 rounded-xl hover:scale-105 transition-transform font-medium shadow-lg">
                    Join as Doctor
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm animate-fade-in">
        © {new Date().getFullYear()} Medibot. All rights reserved.
      </footer>
    </div>
  );

}
