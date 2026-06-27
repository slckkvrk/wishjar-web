"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage("Incorrect email or password.");
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <header className="border-b border-[#1e0d5c] bg-[#2c1875]">
        <div className="mx-auto flex h-10 max-w-5xl items-center px-4">
          <a href="/" className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#a78bfa" />
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#7c3aed" />
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="white" />
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </a>
        </div>
      </header>

      <div className="mx-auto mt-16 max-w-sm px-4">
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h1 className="text-base font-bold text-gray-900">Sign in to WishJar</h1>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {message}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded bg-violet-700 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-semibold text-violet-700 hover:underline">
              Create one free
            </a>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
