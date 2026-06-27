"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const categories = [
  "New Home",
  "Wedding",
  "Baby",
  "Birthday",
  "Travel",
  "Education",
  "Gaming",
  "Startup",
  "Charity",
  "Other",
];

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

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status")
        .eq("id", jarId)
        .single();

      if (error || !data) {
        setMessage("Jar not found.");
        setLoading(false);
        return;
      }

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
    if (!title.trim()) {
      setMessage("Jar name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("jars")
      .update({
        title: title.trim(),
        category,
        goal_amount: goalAmount ? Number(goalAmount) : null,
        description: description.trim() || null,
      })
      .eq("id", jarId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/jars/${jarId}`);
  };

  const handleComplete = async () => {
    if (!confirm("Mark this jar as complete? This will celebrate it for all members!")) return;

    setCompleting(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userData.user.id)
      .single();

    const { error } = await supabase
      .from("jars")
      .update({ status: "completed" })
      .eq("id", jarId);

    if (error) {
      setMessage(error.message);
      setCompleting(false);
      return;
    }

    await supabase.channel("jar-completions").send({
      type: "broadcast",
      event: "jar_completed",
      payload: {
        jar_title: title,
        username: profile?.username ?? "someone",
      },
    });

    window.location.href = "/dashboard";
  };

  const handleDelete = async () => {
    if (!confirm("Delete this jar and all its wish items? This cannot be undone.")) return;

    setDeleting(true);

    const { error } = await supabase.from("jars").delete().eq("id", jarId);

    if (error) {
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    window.location.href = "/dashboard";
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

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-sm" aria-hidden="true">
              <defs>
                <linearGradient id="jarGradientEdit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jarGradientEdit)" />
              <path
                d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
                fill="white"
              />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-violet-200">WishJar</span>
          </a>

          <a
            href={`/jars/${jarId}`}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            ← Back to Jar
          </a>
        </header>

        {/* Form */}
        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
            Edit Jar
          </p>
          <h1 className="mb-8 text-3xl font-extrabold">Update your jar</h1>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Jar name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Category</label>
              <select
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Goal amount{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-black/10 pl-8 pr-4 py-3 outline-none focus:border-violet-500"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {message && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
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

        {/* Complete jar */}
        {status === "active" && (
          <section className="mt-6 rounded-3xl border border-green-100 bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-sm font-bold text-green-700">Mark as Complete</h2>
            <p className="mb-4 text-sm text-gray-500">
              When your jar goal is reached, celebrate it with everyone on WishJar.
              Confetti will appear on all members&apos; screens.
            </p>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="rounded-full border border-green-300 bg-green-50 px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              {completing ? "Completing..." : "🎉 Mark as Complete"}
            </button>
          </section>
        )}

        {status === "completed" && (
          <section className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 shadow-xl">
            <p className="text-sm font-bold text-green-700">🎉 This jar is completed!</p>
          </section>
        )}

        {/* Danger zone */}
        <section className="mt-6 rounded-3xl border border-red-100 bg-white p-6 shadow-xl">
          <h2 className="mb-1 text-sm font-bold text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-gray-500">
            Deleting this jar will permanently remove all wish items inside it.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Jar"}
          </button>
        </section>

      </div>
    </main>
  );
}
