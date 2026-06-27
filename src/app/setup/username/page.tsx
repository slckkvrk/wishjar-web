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
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", userData.user.id).single();
      if (profile?.username) { window.location.href = "/dashboard"; return; }
      setLoading(false);
    };
    check();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) { setMessage("Username must be at least 3 characters (letters, numbers, underscore)."); return; }
    if (cleaned.length > 20) { setMessage("Username must be 20 characters or less."); return; }

    setSaving(true);
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/login"; return; }

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
      <div className="flex min-h-screen items-center justify-center bg-[#f0eeea]">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      {/* Simple top bar */}
      <div className="flex h-10 items-center bg-[#2c1875] px-4">
        <span className="text-sm font-bold text-white">WishJar</span>
      </div>

      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-gray-900">One last step</h1>
          <p className="mt-1 text-xs text-gray-500">Choose your WishJar username to continue.</p>
        </div>

        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Set up your profile</span>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center rounded border border-gray-300 px-3 py-2 focus-within:border-violet-500">
                <span className="mr-1 text-sm text-gray-400">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  maxLength={20}
                  className="flex-1 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Letters, numbers, underscore only. 3–20 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Bio <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you…"
                rows={3}
                maxLength={160}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || username.length < 3}
              className="w-full rounded bg-violet-700 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Continue to WishJar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
