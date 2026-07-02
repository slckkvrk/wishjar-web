"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import ManifestoText from "@/components/ManifestoText";
import { sanitizeText } from "@/lib/validate";

export default function ManifestoSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      const { data: profile } = await supabase
        .from("profiles").select("manifest_line1, manifest_line2").eq("id", auth.userId).single();
      setLine1(profile?.manifest_line1 ?? "");
      setLine2(profile?.manifest_line2 ?? "");
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const cleanedLine1 = sanitizeText(line1, 60) || null;
    const cleanedLine2 = sanitizeText(line2, 60) || null;
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ manifest_line1: cleanedLine1, manifest_line2: cleanedLine2 })
      .eq("id", userId);
    setSaving(false);
    if (updateErr) {
      setError(`Error: ${updateErr.message}`);
      return;
    }
    setLine1(cleanedLine1 ?? "");
    setLine2(cleanedLine2 ?? "");
    setSuccess(true);
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
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a href="/settings" className="text-wj-plum hover:underline">← Settings</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Manifesto</h1>
          <p className="text-xs text-wj-muted mt-0.5">Only you see this. What you write here becomes real.</p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div>
            <label className={labelCls}>Line 1</label>
            <input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              maxLength={60}
              placeholder="Good things are coming."
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{line1.length}/60</p>
          </div>
          <div>
            <label className={labelCls}>Line 2</label>
            <input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              maxLength={60}
              placeholder="I'm ready for them."
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{line2.length}/60</p>
          </div>

          <div>
            <p className={labelCls}>Preview</p>
            <div className="rounded-xl border border-wj-card-border bg-wj-cream px-3 py-3">
              <ManifestoText line1={line1 || null} line2={line2 || null} />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">Saved!</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
