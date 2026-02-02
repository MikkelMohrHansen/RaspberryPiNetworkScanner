import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setAuthSessionCookie } from "@/lib/authCookie";

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/iphandling";

  function onSubmit(e) {
    e.preventDefault();
    setAuthSessionCookie();
    onLogin?.();
    navigate(from, { replace: true });
    // TODO: hook til din auth (Flask endpoint / JWT / session)
    console.log({ email, password });
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
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
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

              <button
                type="submit"
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
