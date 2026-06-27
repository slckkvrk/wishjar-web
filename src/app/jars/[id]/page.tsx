"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
  created_at: string;
};

type Wish = {
  id: string;
  title: string;
  description: string | null;
  product_url: string | null;
  price: number | null;
  created_at: string;
};

export default function JarDetailPage() {
  const params = useParams();
  const jarId = params.id as string;

  const [jar, setJar] = useState<Jar | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadJar = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(userData.user.email ?? null);

      const { data, error } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, created_at")
        .eq("id", jarId)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setJar(data);

      const { data: wishesData, error: wishesError } = await supabase
        .from("wishes")
        .select("id, title, description, product_url, price, created_at")
        .eq("jar_id", jarId)
        .order("created_at", { ascending: false });

      if (wishesError) {
        setMessage(wishesError.message);
        setLoading(false);
        return;
      }

      setWishes(wishesData ?? []);
      setLoading(false);
    };

    loadJar();
  }, [jarId]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteWish = async (wishId: string) => {
    if (!confirm("Remove this wish item?")) return;

    setDeletingId(wishId);

    const { error } = await supabase.from("wishes").delete().eq("id", wishId);

    if (error) {
      setMessage(error.message);
      setDeletingId(null);
      return;
    }

    setWishes((prev) => prev.filter((w) => w.id !== wishId));
    setDeletingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading jar...</p>
      </main>
    );
  }

  if (!jar) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-3xl">
          <a href="/dashboard" className="mb-8 inline-block text-sm text-gray-500">
            ← Back to Home
          </a>
          <h1 className="text-3xl font-bold">Jar not found</h1>
          {message && <p className="mt-4 text-red-600">{message}</p>}
        </div>
      </main>
    );
  }

  const totalWishValue = wishes.reduce((sum, w) => sum + (w.price ?? 0), 0);
  const progressPercent =
    jar.goal_amount && jar.goal_amount > 0
      ? Math.min((totalWishValue / jar.goal_amount) * 100, 100)
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-sm" aria-hidden="true">
              <defs>
                <linearGradient id="jarGradientDetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jarGradientDetail)" />
              <path
                d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
                fill="white"
              />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-violet-200">WishJar</span>
          </a>

          <a
            href="/dashboard"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            ← Home
          </a>
        </header>

        {/* Jar info */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="mb-2 inline-block rounded-full bg-violet-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
                {jar.category}
              </span>
              <h1 className="text-4xl font-bold md:text-5xl">{jar.title}</h1>
              {jar.description && (
                <p className="mt-3 max-w-2xl text-white/70">{jar.description}</p>
              )}
              <p className="mt-4 text-xs text-white/40">Owner: {email}</p>
            </div>

            <a
              href={`/jars/${jar.id}/edit`}
              className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              Edit Jar
            </a>
          </div>
        </section>

        {/* Main grid: wishes (left) + sidebar (right) */}
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">

          {/* Wishes list */}
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Wish Items</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {wishes.length === 0
                    ? "No items yet — add something to this jar."
                    : `${wishes.length} item${wishes.length === 1 ? "" : "s"} in this jar`}
                </p>
              </div>

              <a
                href={`/jars/${jar.id}/wishes/new`}
                className="shrink-0 rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
              >
                + Add Item
              </a>
            </div>

            {wishes.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-gray-400">
                <p className="mb-4">Nothing here yet.</p>
                <a
                  href={`/jars/${jar.id}/wishes/new`}
                  className="inline-block rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
                >
                  Add Your First Wish
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {wishes.map((wish) => (
                  <article
                    key={wish.id}
                    className="rounded-2xl border border-black/10 bg-gray-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold">{wish.title}</h3>
                        {wish.description && (
                          <p className="mt-1 text-sm text-gray-600">{wish.description}</p>
                        )}
                        {wish.product_url && (
                          <a
                            href={wish.product_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-violet-700 underline"
                          >
                            Open product link →
                          </a>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {wish.price !== null && (
                          <span className="rounded-full bg-white border px-3 py-1 text-sm font-bold">
                            ${wish.price.toLocaleString()}
                          </span>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={`/jars/${jar.id}/wishes/${wish.id}/edit`}
                            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleDeleteWish(wish.id)}
                            disabled={deletingId === wish.id}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === wish.id ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {message && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
            )}
          </section>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">

            {/* Progress */}
            <div className="rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-bold">Progress</h2>

              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Total Wish Value</p>
                  <p className="text-2xl font-bold">
                    ${totalWishValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500">Goal</p>
                  <p className="text-2xl font-bold text-violet-700">
                    {jar.goal_amount ? `$${jar.goal_amount.toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>

              <div className="h-3 rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-violet-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {jar.goal_amount && (
                <p className="mt-2 text-right text-xs text-gray-400">
                  {Math.round(progressPercent)}% of goal
                </p>
              )}
            </div>

            {/* Share */}
            <div className="rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-bold">Share this Jar</h2>
              <p className="mb-4 text-sm text-gray-500">
                Share this link so others can see your wishes.
              </p>

              <div className="mb-3 rounded-xl border bg-gray-50 p-3 text-xs text-gray-500 break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

          </aside>
        </div>

      </div>
    </main>
  );
}
