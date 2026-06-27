"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setMessage("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    window.location.href = "/setup/username";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignUp();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <svg viewBox="0 0 64 64" className="mb-4 h-14 w-14 drop-shadow-lg" aria-hidden="true">
            <defs>
              <linearGradient id="jarGradientSignup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B6CFF" />
                <stop offset="100%" stopColor="#4F32C8" />
              </linearGradient>
            </defs>
            <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
            <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jarGradientSignup)" />
            <path
              d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
              fill="white"
            />
          </svg>
          <span className="text-3xl font-extrabold tracking-tight text-violet-200">WishJar</span>
          <p className="mt-2 text-sm text-white/50">Create your account</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          {success ? (
            <div className="text-center">
              <p className="mb-2 text-lg font-bold text-white">You&apos;re in!</p>
              <p className="text-sm text-white/60">Redirecting to your home...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-400 focus:bg-white/15"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-400 focus:bg-white/15"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* KVKK / GDPR consent checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
                />
                <span className="text-xs leading-5 text-white/60">
                  I am at least 13 years old and I agree to WishJar&apos;s{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-violet-300 underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-violet-300 underline"
                  >
                    Privacy Policy
                  </a>
                  {" "}(including cross-border data transfer to the US via Supabase).
                </span>
              </label>

              {message && (
                <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">{message}</p>
              )}

              <button
                onClick={handleSignUp}
                disabled={loading || !agreed}
                className="w-full rounded-full bg-violet-600 py-4 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
                Login
              </a>
            </p>
          )}
        </div>

        <p className="mt-6 text-center">
          <a href="/" className="text-sm text-white/30 hover:text-white/60">
            ← Back to WishJar
          </a>
        </p>
      </div>
    </main>
  );
}
