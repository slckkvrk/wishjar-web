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
      if (profile?.username) { window.location.href = "/"; return; }
      setLoading(false);
    };
    check();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) { setMessage("Min 3 characters."); return; }
    if (cleaned.length > 20) { setMessage("Max 20 characters."); return; }
    setSaving(true);
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/login"; return; }
    const { error } = await supabase.from("profiles").insert({ id: userData.user.id, username: cleaned, bio: bio.trim() || null });
    setSaving(false);
    if (error) {
      if (error.message.includes("unique")) { setMessage("Username taken. Try another."); }
      else { setMessage(error.message); }
      return;
    }
    window.location.href = "/";
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-wj-cream">
      <p className="text-sm text-wj-muted">Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-wj-cream">
      <div className="flex h-12 items-center px-4" style={{ background: "#3D1A24", borderBottom: "1px solid #6B2D40" }}>
        <span className="text-sm font-bold text-white">WishJar</span>
      </div>

      <div className="mx-auto max-w-sm px-4 py-12">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-wj-text">One last step</h1>
          <p className="mt-1 text-xs text-wj-muted">Pick a username.</p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border overflow-hidden" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="border-b border-wj-card-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-wj-muted">Your profile</span>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Username <span className="text-red-500">*</span></label>
              <div className="flex items-center rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 focus-within:border-wj-plum">
                <span className="mr-1 text-sm text-wj-muted">@</span>
                <input value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname" maxLength={20}
                  className="flex-1 text-sm outline-none bg-transparent text-wj-text" />
              </div>
              <p className="mt-1 text-xs text-wj-muted">a-z, 0-9, _ · 3–20 chars</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Bio <span className="text-wj-muted font-normal">(optional)</span></label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="About you…" rows={3} maxLength={160}
                className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text" />
            </div>
            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}
            <button onClick={handleSave} disabled={saving || username.length < 3}
              className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50">
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
