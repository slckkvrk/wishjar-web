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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!email) { setMessage("Enter your email."); return; }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setSent(true);
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
            <h1 className="text-base font-bold text-wj-text">Reset password</h1>
            <p className="mt-0.5 text-xs text-wj-muted">We&apos;ll send a reset link to your email.</p>
          </div>

          {sent ? (
            <div className="px-5 py-6 text-center">
              <p className="text-2xl mb-3">📬</p>
              <p className="text-sm font-semibold text-wj-text mb-1">Check your inbox</p>
              <p className="text-xs text-wj-muted">Reset link sent to <strong>{email}</strong>. Check spam if you don&apos;t see it.</p>
              <a href="/login" className="mt-4 inline-block text-xs text-wj-plum hover:underline">← Back to sign in</a>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-wj-text">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text"
                  placeholder="you@example.com"
                />
              </div>
              {message && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
              )}
              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </div>
          )}

          <div className="border-t border-wj-card-border bg-wj-cream px-5 py-3 text-xs text-wj-muted">
            Remember it?{" "}
            <a href="/login" className="font-semibold text-wj-plum hover:underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
