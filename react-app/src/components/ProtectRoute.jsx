import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAuthCookie } from "@/lib/authCookie";

export const ProtectedRoute = () => {
  const location = useLocation();

  if (!hasAuthCookie()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
