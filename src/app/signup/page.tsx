"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Please accept the Terms and Privacy Policy to continue.");
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
    window.location.href = "/setup/username";
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
            <h1 className="text-base font-bold text-gray-900">Create your WishJar account</h1>
            <p className="mt-0.5 text-xs text-gray-500">It&apos;s free. No credit card required.</p>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
                placeholder="At least 8 characters"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-violet-600"
              />
              <span className="text-xs leading-5 text-gray-600">
                I am at least 13 years old and I agree to WishJar&apos;s{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-violet-700 underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-700 underline">
                  Privacy Policy
                </a>
                , including transfer of data to Supabase (US).
              </span>
            </label>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {message}
              </p>
            )}

            <button
              onClick={handleSignUp}
              disabled={loading || !agreed}
              className="w-full rounded bg-violet-700 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-violet-700 hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
