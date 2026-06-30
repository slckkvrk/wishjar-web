"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

const categories = ["New Home","Wedding","Baby","Birthday","Travel","Education","Gaming","Startup","Charity","Other"];

export default function NewJarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
      setUserId(data.user.id);
    });
  }, []);

  const handleCreate = async () => {
    if (!userId) { setMessage("You must be logged in."); return; }
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("jars").insert({
      user_id: userId,
      title: sanitizeText(title, 200),
      category,
      goal_amount: goalAmount ? Number(goalAmount) : null,
      description: sanitizeText(description, 1000) || null,
    });
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    window.location.href = "/dashboard";
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href="/dashboard" className="text-xs text-wj-muted">← Home</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Create Jar</h1>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="hidden md:block border-b border-wj-card-border pb-3">
            <h1 className="text-sm font-bold text-wj-text">Create a new jar</h1>
            <p className="mt-0.5 text-xs text-wj-muted">Give your jar a name and set a goal.</p>
          </div>

          <div>
            <label className={labelCls}>Jar name <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Apartment" maxLength={200} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Goal amount <span className="text-wj-muted font-normal">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wj-muted">$</span>
              <input type="number" min="0" step="0.01" value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)} placeholder="1000"
                className={`${inputCls} pl-7`} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this jar is for." rows={4} maxLength={1000}
              className={inputCls} />
          </div>

          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleCreate} disabled={saving}
              className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {saving ? "Creating…" : "Create Jar"}
            </button>
            <a href="/dashboard" className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
          </div>
        </div>
      </div>

      <BottomNav active="create" />
    </div>
  );
}
