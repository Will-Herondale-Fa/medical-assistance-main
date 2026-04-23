import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";
import { clearDoctorToken, hasDoctorToken } from "../utils/auth";
import { refreshSocketAuth } from "../socket/socket";

export default function ProtectedDoctorRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!hasDoctorToken()) {
        if (isMounted) {
          setIsAllowed(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        await api.get("/auth/verify-doctor");
        if (isMounted) {
          setIsAllowed(true);
        }
      } catch {
        clearDoctorToken();
        refreshSocketAuth();
        if (isMounted) {
          setIsAllowed(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Verifying doctor session...
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/doctorlogin" replace />;
  }

  return children;
}
