"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
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
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("username, bio").eq("id", userData.user.id).single();
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
    if (cleaned.length < 3) { setMessage("Username must be at least 3 characters."); return; }
    setSaving(true);
    setMessage("");
    setSuccess(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("profiles").update({
      username: cleaned,
      bio: sanitizeText(bio, 160) || null,
    }).eq("id", userData.user.id);
    setSaving(false);
    if (error) {
      if (error.message.includes("unique")) { setMessage("This username is already taken."); }
      else { setMessage(error.message); }
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
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-8 text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          {currentUsername && (
            <><a href={`/u/${currentUsername}`} className="hover:underline">@{currentUsername}</a>{" / "}</>
          )}
          Settings
        </p>

        {/* Profile settings */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h1 className="text-sm font-bold text-gray-800">Edit Profile</h1>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Username</label>
              <div className="flex items-center rounded border border-gray-300 px-3 py-2 focus-within:border-violet-500">
                <span className="mr-1 text-sm text-gray-400">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  className="flex-1 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Bio <span className="text-gray-400 font-normal">(optional, max 160 chars)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={160}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/160</p>
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}
            {success && (
              <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">Profile updated.</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-4 rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-800">Legal</h2>
          </div>
          <div className="px-4 py-4 space-y-2 text-sm">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="block text-violet-700 hover:underline">
              Privacy Policy (KVKK Aydınlatma Metni / GDPR)
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="block text-violet-700 hover:underline">
              Terms of Service
            </a>
            <p className="mt-2 text-xs text-gray-400">
              To request data access, correction, or deletion, email{" "}
              <a href="mailto:slckkvrk@gmail.com" className="underline">slckkvrk@gmail.com</a>.
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-4 rounded border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50 px-4 py-3">
            <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
          </div>
          <div className="px-4 py-4">
            <p className="mb-3 text-xs leading-5 text-gray-500">
              Deleting your account permanently removes all your data. This cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
