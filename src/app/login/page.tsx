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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setMessage("Enter email and password."); return; }
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMessage("Wrong email or password."); return; }
    const { data: profile } = await supabase
      .from("profiles").select("username").eq("id", data.user!.id).single();
    window.location.href = profile?.username ? "/" : "/setup/username";
  };

  return (
    <div className="min-h-screen bg-wj-cream">
      {/* Inline plum header */}
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
            <h1 className="text-base font-bold text-wj-text">Sign in to WishJar</h1>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Email address</label>
              <input type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-wj-text">Password</label>
                <a href="/forgot-password" className="text-xs text-wj-plum hover:underline">Forgot password?</a>
              </div>
              <input type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                placeholder="••••••••" />
            </div>
            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}
            <button onClick={handleLogin} disabled={loading}
              className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="border-t border-wj-card-border bg-wj-cream px-5 py-3 text-xs text-wj-muted">
            No account?{" "}
            <a href="/signup" className="font-semibold text-wj-plum hover:underline">Sign up free</a>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-wj-muted">
          <a href="/privacy" className="hover:text-wj-text">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="hover:text-wj-text">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
