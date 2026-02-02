import { Routes, Route, Navigate, Outlet} from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { StarBackground } from "./components/StarBackground";
import { Navbar } from "./components/Navbar";

import { IpHandling } from "./pages/IpHandling";
import { Scans } from "./pages/Scans";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login"
import { ProtectedRoute } from "./components/ProtectRoute";

function AuthedLayout() {
  return (
    <>
      <Navbar />
      <main className="pt-2">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <StarBackground />
      <ThemeToggle />
      <main className="pt-2">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthedLayout />}>
              <Route path="/" element={<Navigate to="/iphandling" replace />} />
              <Route path="/iphandling" element={<IpHandling />} />
              <Route path="/scans" element={<Scans />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* Hvis man ikke er logged in og rammer noget random */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
