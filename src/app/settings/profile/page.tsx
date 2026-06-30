"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

export default function SettingsProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      setUserId(userData.user.id);
      const { data: profile } = await supabase
        .from("profiles").select("username, bio").eq("id", userData.user.id).single();
      if (profile) {
        setUsername(profile.username ?? "");
        setSavedUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) { setMessage("Username must be at least 3 characters."); return; }
    if (!userId) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const bioVal = sanitizeText(bio, 160) || null;

    // Try UPDATE first; if no rows affected (profile doesn't exist), fall back to INSERT
    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update({ username: cleaned, bio: bioVal })
      .eq("id", userId)
      .select("username, bio")
      .single();

    if (updateErr) {
      // PGRST116 = no rows matched — profile row missing, try upsert
      if (updateErr.code === "PGRST116") {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert({ id: userId, username: cleaned, bio: bioVal }, { onConflict: "id" });
        if (upsertErr) {
          setSaving(false);
          if (upsertErr.message.includes("unique") || upsertErr.message.includes("duplicate")) {
            setMessage("This username is already taken. Try another one.");
          } else {
            setMessage(`Save failed: ${upsertErr.message} [${upsertErr.code}]`);
          }
          return;
        }
      } else if (updateErr.message.includes("unique") || updateErr.message.includes("duplicate")) {
        setSaving(false);
        setMessage("This username is already taken. Try another one.");
        return;
      } else {
        setSaving(false);
        setMessage(`Save failed: ${updateErr.message} [${updateErr.code}]`);
        return;
      }
    }

    setSaving(false);
    const finalUsername = updated?.username ?? cleaned;
    setSavedUsername(finalUsername);
    setUsername(finalUsername);
    setBio(updated?.bio ?? bio);
    setSuccess(true);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete account? All data will be removed. Cannot be undone.")) return;
    if (!confirm("Sure?")) return;
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 py-6">
        {/* Back navigation */}
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a
            href={savedUsername ? `/u/${savedUsername}` : "/setup/username"}
            className="text-wj-plum hover:underline"
          >
            ← Back to Profile
          </a>
          <span className="text-wj-muted">·</span>
          <a href="/dashboard" className="text-wj-muted hover:text-wj-text">Home</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Profile Settings</h1>
          <p className="text-xs text-wj-muted mt-0.5">Your public info.</p>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="border-b border-wj-card-border pb-3">
            <h2 className="text-sm font-bold text-wj-text">Edit Profile</h2>
            <p className="text-xs text-wj-muted mt-0.5">Visible on your public page.</p>
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <div className="flex items-center rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 focus-within:border-wj-plum">
              <span className="mr-1 text-sm text-wj-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                placeholder="your_username"
                className="flex-1 text-sm outline-none bg-transparent text-wj-text"
              />
            </div>
            <p className="mt-1 text-xs text-wj-muted">a-z, 0-9, _ · min 3</p>
          </div>
          <div>
            <label className={labelCls}>Bio <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="About you…"
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{bio.length}/160</p>
          </div>
          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
          )}
          {success && (
            <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              Profile saved! <a href={`/u/${savedUsername}`} className="underline font-semibold">View your profile →</a>
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Account / Sign Out */}
        <div className="mt-4 rounded-2xl bg-wj-card border border-wj-card-border p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-wj-text mb-1">Account</h2>
          <p className="text-xs text-wj-muted mb-3">Sign out now.</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-xl border border-wj-card-border py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>

        {/* Legal */}
        <div className="mt-4 rounded-2xl bg-wj-card border border-wj-card-border p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-wj-text mb-3">Legal</h2>
          <div className="space-y-2 text-sm">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="block text-wj-plum hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="block text-wj-plum hover:underline">
              Terms of Service
            </a>
            <p className="mt-2 text-xs text-wj-muted">
              Questions? Email{" "}
              <a href="mailto:slckkvrk@gmail.com" className="underline">slckkvrk@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-4 rounded-2xl bg-wj-card border border-red-200 p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="mb-3 text-xs leading-5 text-wj-muted">
            Removes all data. Cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete My Account"}
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
