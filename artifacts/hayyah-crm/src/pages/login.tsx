import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.42.07 2.41.74 3.24.8.94-.19 1.84-.88 3.22-.95 1.65-.09 2.89.59 3.72 1.65-3.24 1.87-2.53 6.08.81 7.26-.55 1.44-1.27 2.87-3 4.1zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}


const BACKEND_URL = "https://hayyah.me";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = login(email, password);
    if (success) { navigate("/"); } else { setError("Invalid credentials. Please try again."); }
    setLoading(false);
  };

  const handleSocial = async (provider: string, path: string) => {
    setSocialLoading(provider);
    // Redirect to backend OAuth endpoint
    window.location.href = `${BACKEND_URL}${path}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0079e0 0%, #0088FB 55%, #33a3ff 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full opacity-5 bg-white" />

        <div className="flex items-center gap-3 z-10">
          <img src="/hayyah-logo.png" alt="Hayyah" className="h-10 w-10 object-contain brightness-0 invert" />
          <span className="text-white text-2xl font-bold tracking-tight">Hayyah</span>
        </div>

        <div className="z-10">
          <h1 className="text-white text-4xl font-bold leading-snug mb-4">
            Manage your home<br />services smarter
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            One platform to handle customers, bookings, and technicians — all in one place.
          </p>
          <div className="space-y-4">
            {[
              { icon: "👥", label: "Customer relationship management" },
              { icon: "📅", label: "Booking & scheduling overview" },
              { icon: "🔧", label: "Technician dispatch & tracking" },
              { icon: "📊", label: "Real-time revenue dashboard" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center text-base flex-shrink-0">{f.icon}</div>
                <span className="text-blue-50 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-sm z-10">© {new Date().getFullYear()} Hayyah. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img src="/hayyah-logo.png" alt="Hayyah" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-foreground">Hayyah</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your CRM dashboard</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => handleSocial("google", "/auth/google")}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {socialLoading === "google"
                ? <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>
                : <GoogleIcon />}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocial("apple", "/auth/apple")}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {socialLoading === "apple"
                ? <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>
                : <AppleIcon />}
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or sign in with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@hayyah.me"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all pr-14"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5 text-sm">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#0088FB" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-7">
            Having trouble?{" "}
            <a href="mailto:support@hayyah.me" className="text-primary hover:underline font-medium">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
