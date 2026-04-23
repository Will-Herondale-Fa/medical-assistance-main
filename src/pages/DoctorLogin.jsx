import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { setDoctorToken } from "../utils/auth";
import { refreshSocketAuth } from "../socket/socket";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/doctor-login", {
        email: email.trim(),
        password: password.trim(),
      });

      setDoctorToken(res.data.token);
      refreshSocketAuth();
      navigate("/doctordashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-7">
        <Link to="/" className="inline-block mt-3 mb-4 text-sm text-cyan-700 hover:text-cyan-800 hover:underline">
          ⬅️ Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Login</h1>
        <p className="text-sm text-slate-600 mt-1">Sign in to access Doctor Dashboard</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@medibot.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 text-white rounded-lg py-2.5 font-medium hover:bg-cyan-700 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
