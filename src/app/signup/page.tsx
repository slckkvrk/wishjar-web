"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

function WishJarLogo() {
  return (
    <svg viewBox="0 0 80 80" className="h-8 w-8" aria-hidden="true">
      <rect x="22" y="8" width="36" height="10" rx="3" fill="#EDD98A" />
      <rect x="16" y="20" width="48" height="52" rx="8" fill="#EDD98A" opacity="0.3" />
      <rect x="16" y="20" width="48" height="52" rx="8" fill="none" stroke="#EDD98A" strokeWidth="2" />
      <path d="M40 32L43 38.5L50 39.5L45 44.5L46.5 52L40 48.5L33.5 52L35 44.5L30 39.5L37 38.5Z" fill="#EDD98A" />
    </svg>
  );
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    if (!email || !password) { setMessage("Enter email and password."); return; }
    if (password.length < 8) { setMessage("Password too short (min 8)."); return; }
    if (!agreed) { setMessage("Accept terms to continue."); return; }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    window.location.href = "/setup/username";
  };

  return (
    <div className="min-h-screen bg-wj-cream">
      <header style={{ background: "#3D1A24", borderBottom: "1px solid #6B2D40" }}>
        <div className="mx-auto flex h-12 max-w-5xl items-center px-4">
          <a href="/" className="flex items-center gap-2">
            <WishJarLogo />
            <span className="text-sm font-bold text-white">WishJar</span>
          </a>
        </div>
      </header>

      <div className="mx-auto mt-14 max-w-sm px-4">
        <div className="rounded-2xl bg-wj-card border border-wj-card-border overflow-hidden" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="border-b border-wj-card-border px-5 py-4">
            <h1 className="text-base font-bold text-wj-text">Join WishJar</h1>
            <p className="mt-0.5 text-xs text-wj-muted">Free. No card needed.</p>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Email address</label>
              <input type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Password</label>
              <input type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                placeholder="At least 8 characters" />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-wj-plum" />
              <span className="text-xs leading-5 text-wj-muted">
                I&apos;m 13+ and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-wj-plum underline">Terms</a>
                {" "}and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-wj-plum underline">Privacy Policy</a>.
              </span>
            </label>
            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}
            <button onClick={handleSignUp} disabled={loading || !agreed}
              className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>

          <div className="border-t border-wj-card-border bg-wj-cream px-5 py-3 text-xs text-wj-muted">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-wj-plum hover:underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
