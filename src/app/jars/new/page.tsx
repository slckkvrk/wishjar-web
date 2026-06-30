"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

const categories = [
  "New Home", "Wedding", "Baby", "Birthday", "Travel",
  "Education", "Gaming", "Startup", "Charity", "Other",
];

const categoryEmoji: Record<string, string> = {
  "New Home": "🏠", "Wedding": "💍", "Baby": "🍼", "Birthday": "🎂",
  "Travel": "✈️", "Education": "📚", "Gaming": "🎮", "Startup": "🚀",
  "Charity": "❤️", "Other": "🫙",
};

export default function NewJarPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
    });
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/login"; return; }

    const { data: inserted, error } = await supabase
      .from("jars")
      .insert({
        user_id: userData.user.id,
        title: sanitizeText(title, 200),
        category,
        goal_amount: goalAmount ? Number(goalAmount) : null,
        description: sanitizeText(description, 1000) || null,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setMessage(`Could not create jar: ${error.message} [${error.code}]`);
      return;
    }

    if (!inserted?.id) {
      setMessage("Jar was created but could not get its ID. Check your dashboard.");
      return;
    }

    window.location.href = `/jars/${inserted.id}`;
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text placeholder:text-wj-muted";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3 text-sm">
            <a href="/dashboard" className="text-wj-muted hover:text-wj-text">← Home</a>
            <span className="text-wj-muted">·</span>
            <a href="/jars" className="text-wj-muted hover:text-wj-text">My Jars</a>
          </div>
          <h1 className="text-2xl font-bold text-wj-text">Create a new jar</h1>
          <p className="text-sm text-wj-muted mt-1">
            A jar is your personal goal — give it a name, pick a category, and start adding wishes inside.
          </p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-5" style={{ boxShadow: "var(--wj-shadow)" }}>

          {/* Jar name */}
          <div>
            <label className={labelCls}>
              Jar name <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Apartment, Dream Wedding, 2025 Travel Fund"
              maxLength={200}
              className={inputCls}
              autoFocus
            />
            <p className="mt-1 text-xs text-wj-muted">Give your jar a clear, memorable name.</p>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: category === c ? "#3D1A24" : "#FDFAF3",
                    borderColor: category === c ? "#3D1A24" : "#E8DCBB",
                    color: category === c ? "white" : "#5C4033",
                  }}
                >
                  <span>{categoryEmoji[c]}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal amount */}
          <div>
            <label className={labelCls}>
              Goal amount <span className="text-wj-muted font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-wj-muted">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="e.g. 5000"
                className={`${inputCls} pl-7`}
              />
            </div>
            <p className="mt-1 text-xs text-wj-muted">
              Set a target total. Your jar will show a progress bar as you add wish items.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>
              Description <span className="text-wj-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this jar is for and why it matters to you. This shows up on your public profile."
              rows={4}
              maxLength={1000}
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{description.length}/1000</p>
          </div>

          {/* Error */}
          {message && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700 mb-0.5">Could not create jar</p>
              <p className="text-xs text-red-600">{message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-wj-card-border pt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="flex-1 rounded-xl bg-wj-plum py-3 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50"
            >
              {saving ? "Creating jar…" : "🫙 Create Jar"}
            </button>
            <a
              href="/dashboard"
              className="rounded-xl border border-wj-card-border px-5 py-3 text-sm font-semibold text-wj-text hover:bg-wj-cream"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>

      <BottomNav active="create" />
    </div>
  );
}
