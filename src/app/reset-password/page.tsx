"use client";

import { useEffect, useState } from "react";
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

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Supabase PKCE recovery links arrive as ?code=xxx
    // Implicit flow links arrive with #access_token=...&type=recovery in the hash
    const hasCode = new URLSearchParams(window.location.search).has("code");
    const hasRecoveryHash = window.location.hash.includes("type=recovery");

    if (!hasCode && !hasRecoveryHash) {
      // No recovery token in URL — direct navigation or expired link
      setStatus("invalid");
      return;
    }

    // Recovery URL detected — wait for Supabase to exchange the code and fire the event.
    // PKCE exchange is async (network call), so give it 10s before giving up.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
      }
    });

    const timer = setTimeout(() => {
      setStatus((s) => s === "checking" ? "invalid" : s);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleReset = async () => {
    if (!password) { setMessage("Enter a new password."); return; }
    if (password.length < 8) { setMessage("Password too short (min 8)."); return; }
    if (password !== confirm) { setMessage("Passwords don't match."); return; }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setStatus("done");
    setTimeout(() => { window.location.href = "/"; }, 2000);
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
            <h1 className="text-base font-bold text-wj-text">New password</h1>
            <p className="mt-0.5 text-xs text-wj-muted">Choose a strong password.</p>
          </div>

          {status === "checking" && (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-wj-muted">Verifying link…</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="px-5 py-6 text-center">
              <p className="text-2xl mb-3">🔒</p>
              <p className="text-sm font-semibold text-wj-text mb-1">Link invalid or expired</p>
              <p className="text-xs text-wj-muted mb-5">
                This password reset link is invalid or has expired.
              </p>
              <div className="flex flex-col gap-2">
                <a href="/forgot-password"
                  className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
                  Request a new link
                </a>
                <a href="/login" className="text-xs text-wj-plum hover:underline mt-1">
                  Back to sign in
                </a>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="px-5 py-6 text-center">
              <p className="text-2xl mb-3">✅</p>
              <p className="text-sm font-semibold text-wj-text">Password updated!</p>
              <p className="text-xs text-wj-muted mt-1">Redirecting…</p>
            </div>
          )}

          {status === "ready" && (
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-wj-text">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-wj-text">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                  placeholder="Same password again"
                />
              </div>
              {message && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
              )}
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
