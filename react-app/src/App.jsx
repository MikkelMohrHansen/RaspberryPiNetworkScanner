import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { StarBackground } from "./components/StarBackground";
import { Navbar } from "./components/Navbar";

import { IpHandling } from "./pages/IpHandling";
import { Scans } from "./pages/Scans";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      {/* Always on top */}
      <ThemeToggle />
      <StarBackground />
      <Navbar />

      {/* Page content */}
      <main className="pt-2">
        <Routes>
          <Route path="/" element={<Navigate to="/iphandling" replace />} />
          <Route path="/iphandling" element={<IpHandling />} />
          <Route path="/scans" element={<Scans />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
