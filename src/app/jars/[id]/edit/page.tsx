"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

const categories = ["New Home","Wedding","Baby","Birthday","Travel","Education","Gaming","Startup","Charity","Other"];

export default function EditJarPage() {
  const params = useParams();
  const router = useRouter();
  const jarId = params.id as string;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadJar = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data, error } = await supabase
        .from("jars").select("id, user_id, title, description, category, goal_amount, status")
        .eq("id", jarId).single();
      if (error || !data) { setMessage("Jar not found."); setLoading(false); return; }
      if (data.user_id !== userData.user.id) { window.location.href = `/jars/${jarId}`; return; }
      setTitle(data.title);
      setCategory(data.category);
      setGoalAmount(data.goal_amount ? String(data.goal_amount) : "");
      setDescription(data.description ?? "");
      setStatus(data.status ?? "active");
      setLoading(false);
    };
    loadJar();
  }, [jarId]);

  const handleSave = async () => {
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.from("jars").update({
      title: sanitizeText(title, 200), category,
      goal_amount: goalAmount ? Number(goalAmount) : null,
      description: sanitizeText(description, 1000) || null,
    }).eq("id", jarId);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    router.push(`/jars/${jarId}`);
  };

  const handleComplete = async () => {
    if (!confirm("Mark this jar as complete? This will celebrate it for all members!")) return;
    setCompleting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", userData.user.id).single();
    const { error } = await supabase.from("jars").update({ status: "completed" }).eq("id", jarId);
    if (error) { setMessage(error.message); setCompleting(false); return; }
    await supabase.channel("jar-completions").send({
      type: "broadcast", event: "jar_completed",
      payload: { jar_title: title, username: profile?.username ?? "someone" },
    });
    window.location.href = "/dashboard";
  };

  const handleDelete = async () => {
    if (!confirm("Delete this jar and all its wish items? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("jars").delete().eq("id", jarId);
    if (error) { setMessage(error.message); setDeleting(false); return; }
    window.location.href = "/jars";
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href={`/jars/${jarId}`} className="text-xs text-wj-muted">← Back to Jar</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Edit Jar</h1>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="hidden md:block border-b border-wj-card-border pb-3">
            <h1 className="text-base font-bold text-wj-text">Edit jar</h1>
          </div>
          <div>
            <label className={labelCls}>Jar name <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputCls} />
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
                onChange={(e) => setGoalAmount(e.target.value)} className={`${inputCls} pl-7`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} maxLength={1000} className={inputCls} />
          </div>
          {message && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <a href={`/jars/${jarId}`} className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
          </div>
        </div>

        {status === "active" && (
          <div className="mt-4 rounded-2xl bg-wj-card border border-wj-gold-card p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h2 className="text-sm font-bold text-wj-text mb-2">Mark as Complete</h2>
            <p className="mb-3 text-xs leading-5 text-wj-muted">
              When your jar goal is reached, celebrate it with everyone on WishJar. Confetti will appear on all members&apos; screens.
            </p>
            <button onClick={handleComplete} disabled={completing}
              className="rounded-xl border border-wj-gold bg-wj-gold-card px-4 py-2 text-sm font-bold text-wj-text hover:opacity-80 disabled:opacity-50">
              {completing ? "Completing…" : "🎉 Mark as Complete"}
            </button>
          </div>
        )}

        {status === "completed" && (
          <div className="mt-4 rounded-2xl bg-wj-gold-light border border-wj-gold-card px-4 py-3">
            <p className="text-sm font-semibold text-wj-text">🎉 This jar is completed!</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-wj-card border border-red-200 p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="mb-3 text-xs leading-5 text-wj-muted">
            Deleting this jar will permanently remove all wish items inside it.
          </p>
          <button onClick={handleDelete} disabled={deleting}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete Jar"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
