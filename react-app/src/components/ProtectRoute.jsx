import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = (import.meta?.env?.VITE_API_URL || "http://192.168.1.217:5000/api/v1").replace(/\/$/, "");

export const ProtectedRoute = () => {
  const location = useLocation();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          credentials: "include",
        });

        setStatus(res.ok ? "authed" : "no");
      } catch {
        setStatus("no");
      }
    })();
  }, []);

  if (status === "loading") return null; // evt. en loader senere

  if (status === "no") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
