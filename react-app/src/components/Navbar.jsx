import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { name: "IpHandling", to: "/iphandling" },
  { name: "Scans", to: "/scans" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && setIsMenuOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 w-full z-40 transition-all duration-300",
          isScrolled ? "py-3 bg-background/80 backdrop-blur-md shadow-sm" : "py-5"
        )}
      >
        <div className="container flex items-center justify-between">
          {/* DESKTOP */}
          <div className="hidden md:flex space-x-8 md:mr-4 lg:mr-6 md:ml-4 lg:ml-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-foreground/80 hover:text-primary transition-colors duration-300",
                    isActive && "text-primary"
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 text-foreground z-50"
            aria-label="Open Menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-overlay"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      <div
        id="mobile-nav-overlay"
        className={cn(
          "fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col items-center justify-center md:hidden",
          "transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-6 right-6 p-3 text-foreground border rounded-md bg-background/40"
          aria-label="Close Menu"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col space-y-8 text-xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-foreground/80 hover:text-primary transition-colors duration-300",
                  isActive && "text-primary"
                )
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};
