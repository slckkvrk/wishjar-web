"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeText } from "@/lib/validate";

export default function SettingsProfilePage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setCurrentUsername(profile.username);
        setBio(profile.bio ?? "");
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleaned.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    setSaving(true);
    setMessage("");
    setSuccess(false);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: cleaned,
        bio: sanitizeText(bio, 160) || null,
      })
      .eq("id", userData.user.id);

    setSaving(false);

    if (error) {
      if (error.message.includes("unique")) {
        setMessage("This username is already taken.");
      } else {
        setMessage(error.message);
      }
      return;
    }

    setCurrentUsername(cleaned);
    setSuccess(true);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account? All your jars, wishes, and posts will be permanently removed. This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;

    setDeleting(true);

    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8 text-black">
      <div className="mx-auto max-w-xl">

        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
              <defs>
                <linearGradient id="jgs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jgs)" />
              <path d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z" fill="white" />
            </svg>
            <span className="text-2xl font-extrabold text-violet-200">WishJar</span>
          </a>
          <a
            href={`/u/${currentUsername}`}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            ← My Profile
          </a>
        </header>

        {/* Profile settings */}
        <section className="mb-6 rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">Settings</p>
          <h1 className="mb-8 text-3xl font-extrabold">Edit Profile</h1>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">Username</label>
              <div className="flex items-center rounded-2xl border border-black/10 px-4 py-3">
                <span className="mr-1 text-gray-400">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  className="flex-1 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Bio <span className="font-normal text-gray-400">(optional, max 160 chars)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={160}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/160</p>
            </div>

            {message && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
            )}
            {success && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">Profile updated.</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-violet-700 py-4 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        {/* Legal links */}
        <section className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-sm font-bold">Legal</h2>
          <div className="space-y-2 text-sm">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="block text-violet-700 underline">
              Privacy Policy (KVKK Aydınlatma Metni / GDPR)
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="block text-violet-700 underline">
              Terms of Service
            </a>
            <p className="mt-3 text-xs text-gray-400">
              To request data access, correction, or deletion, email{" "}
              <a href="mailto:slckkvrk@gmail.com" className="underline">slckkvrk@gmail.com</a>.
            </p>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-xl">
          <h2 className="mb-1 text-sm font-bold text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-gray-500">
            Deleting your account permanently removes all your data. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </section>

      </div>
    </main>
  );
}
