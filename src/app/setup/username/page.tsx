"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SetupUsernamePage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .single();

      if (profile?.username) {
        window.location.href = "/dashboard";
        return;
      }

      setLoading(false);
    };

    check();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleaned.length < 3) {
      setMessage("Username must be at least 3 characters (letters, numbers, underscore).");
      return;
    }

    if (cleaned.length > 20) {
      setMessage("Username must be 20 characters or less.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: userData.user.id,
      username: cleaned,
      bio: bio.trim() || null,
    });

    setSaving(false);

    if (error) {
      if (error.message.includes("unique")) {
        setMessage("This username is already taken. Try another one.");
      } else {
        setMessage(error.message);
      }
      return;
    }

    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-6">
      <div className="w-full max-w-md">

        <div className="mb-8 flex flex-col items-center">
          <svg viewBox="0 0 64 64" className="mb-4 h-14 w-14" aria-hidden="true">
            <defs>
              <linearGradient id="jg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B6CFF" />
                <stop offset="100%" stopColor="#4F32C8" />
              </linearGradient>
            </defs>
            <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
            <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jg)" />
            <path d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z" fill="white" />
          </svg>
          <span className="text-3xl font-extrabold text-violet-200">One last step</span>
          <p className="mt-2 text-sm text-white/50">Choose your WishJar username</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/80">
                Username
              </label>
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <span className="mr-1 text-white/40">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  maxLength={20}
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-white/30">
                Letters, numbers, underscore only. 3–20 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/80">
                Bio <span className="font-normal text-white/30">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you..."
                rows={3}
                maxLength={160}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-400"
              />
            </div>

            {message && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">{message}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || username.length < 3}
              className="w-full rounded-full bg-violet-600 py-4 font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue to WishJar"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
