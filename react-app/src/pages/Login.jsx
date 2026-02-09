import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");

export const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/iphandling";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Login fejlede");
        setLoading(false);
        return;
      }

      // Login ok: server har sat JWT cookie
      onLogin?.();
      navigate(from, { replace: true });
    } catch (err) {
      setError("Kunne ikke kontakte API'et");
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen w-full relative z-10">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-semibold">Login</h1>
            <p className="text-sm text-foreground/60">
              Log ind for at bruge Netværksscanner
            </p>
          </div>

          {/* Card */}
          <div className="w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-6 py-10 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="h-10 w-full rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none placeholder:text-foreground/40 focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-10 w-full rounded-xl border border-foreground/10 bg-background px-3 text-sm outline-none placeholder:text-foreground/40 focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                {loading ? "Logger ind..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};