"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
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
        .from("jars")
        .select("id, title, description, category, goal_amount, status")
        .eq("id", jarId)
        .single();

      if (error || !data) { setMessage("Jar not found."); setLoading(false); return; }

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
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("jars").update({
      title: sanitizeText(title, 200),
      category,
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
      type: "broadcast",
      event: "jar_completed",
      payload: { jar_title: title, username: profile?.username ?? "someone" },
    });
    window.location.href = "/dashboard";
  };

  const handleDelete = async () => {
    if (!confirm("Delete this jar and all its wish items? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("jars").delete().eq("id", jarId);
    if (error) { setMessage(error.message); setDeleting(false); return; }
    window.location.href = "/dashboard";
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
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          <a href="/dashboard" className="hover:underline">Home</a>
          {" / "}
          <a href={`/jars/${jarId}`} className="hover:underline">Jar</a>
          {" / Edit"}
        </p>

        {/* Edit form */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h1 className="text-sm font-bold text-gray-800">Edit jar</h1>
          </div>
          <div className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Jar name <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Goal amount <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="w-full rounded border border-gray-300 pl-7 pr-3 py-2 text-sm outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <a href={`/jars/${jarId}`} className="text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </a>
            </div>
          </div>
        </div>

        {/* Mark as complete */}
        {status === "active" && (
          <div className="mt-4 rounded border border-green-200 bg-white shadow-sm">
            <div className="border-b border-green-100 bg-green-50 px-4 py-3">
              <h2 className="text-sm font-bold text-green-800">Mark as Complete</h2>
            </div>
            <div className="px-4 py-4">
              <p className="mb-3 text-xs leading-5 text-gray-500">
                When your jar goal is reached, celebrate it with everyone on WishJar. Confetti will appear on all members&apos; screens.
              </p>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="rounded border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                {completing ? "Completing…" : "🎉 Mark as Complete"}
              </button>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-green-700">🎉 This jar is completed!</p>
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-4 rounded border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50 px-4 py-3">
            <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
          </div>
          <div className="px-4 py-4">
            <p className="mb-3 text-xs leading-5 text-gray-500">
              Deleting this jar will permanently remove all wish items inside it.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete Jar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
