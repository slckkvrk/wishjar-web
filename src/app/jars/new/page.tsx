"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import VerificationGate from "@/components/VerificationGate";
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

const MAX_JARS = 3;

export default function NewJarPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [atLimit, setAtLimit] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [ownUsername, setOwnUsername] = useState("");

  useEffect(() => {
    const check = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setOwnUsername(auth.username);

      if (!auth.isVerified) {
        const { data: profile } = await supabase
          .from("profiles").select("first_name, last_name, city, country, phone").eq("id", auth.userId).single();
        const missing: string[] = [];
        if (!(profile?.first_name ?? "").trim()) missing.push("first name");
        if (!(profile?.last_name ?? "").trim()) missing.push("last name");
        if (!(profile?.city ?? "").trim()) missing.push("city");
        if (!(profile?.country ?? "").trim()) missing.push("country");
        if (!(profile?.phone ?? "").trim()) missing.push("phone");
        setMissingFields(missing);
        setIsVerified(false);
        setLoading(false);
        return;
      }

      if (auth.isPremium) { setLoading(false); return; }

      const { count } = await supabase
        .from("jars")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "active");

      if ((count ?? 0) >= MAX_JARS) setAtLimit(true);
      setLoading(false);
    };
    check();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true);
    setMessage("");

    const auth = await requireUsername();
    if (!auth) return;

    if (!auth.isPremium) {
      // Re-check limit at submit time
      const { count } = await supabase
        .from("jars")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "active");

      if ((count ?? 0) >= MAX_JARS) {
        setAtLimit(true);
        setSaving(false);
        return;
      }
    }

    const { data: inserted, error } = await supabase
      .from("jars")
      .insert({
        user_id: auth.userId,
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

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader activeTab="home" />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  if (!isVerified) return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <VerificationGate missingFields={missingFields} />
      <BottomNav active="create" />
    </div>
  );

  if (atLimit) return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a href="/" className="text-wj-muted hover:text-wj-text">← Home</a>
        </div>
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-6 text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
          <p className="text-2xl mb-3">🫙</p>
          <h1 className="text-base font-bold text-wj-text mb-2">Jar limit reached</h1>
          <p className="text-sm text-wj-muted mb-5">
            You can have up to {MAX_JARS} active jars. Complete or delete one to create a new jar.
          </p>
          <a href={`/u/${ownUsername}`} className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
            View my jars
          </a>
        </div>
      </div>
      <BottomNav active="create" />
    </div>
  );

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3 text-sm">
            <a href="/" className="text-wj-muted hover:text-wj-text">← Home</a>
            <span className="text-wj-muted">·</span>
            <a href="/jars" className="text-wj-muted hover:text-wj-text">My Jars</a>
          </div>
          <h1 className="text-2xl font-bold text-wj-text">Create a new jar</h1>
          <p className="text-sm text-wj-muted mt-1">Name your goal, pick a category, and add wishes.</p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div>
            <label className={labelCls}>Jar name <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Apartment, Dream Wedding, 2025 Travel Fund"
              maxLength={200}
              className={inputCls}
              autoFocus
            />
          </div>

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

          <div>
            <label className={labelCls}>Goal amount <span className="text-wj-muted font-normal">(optional)</span></label>
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
            <p className="mt-1 text-xs text-wj-muted">Set a target amount.</p>
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this jar for?"
              rows={4}
              maxLength={1000}
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{description.length}/1000</p>
          </div>

          {message && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">{message}</p>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-wj-card-border pt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="flex-1 rounded-xl bg-wj-plum py-3 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50"
            >
              {saving ? "Creating jar…" : "🫙 Create Jar"}
            </button>
            <a
              href="/"
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
