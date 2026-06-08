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
  return;
}

setWishes(wishesData || []);
      setLoading(false);
    };

    loadJar();
  }, [jarId]);
const handleCopyLink = async () => {
  await navigator.clipboard.writeText(window.location.href);
  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 2000);
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

          {message && (
            <p className="mt-4 text-red-600">
              {message}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center">
              <svg
                viewBox="0 0 64 64"
                className="h-11 w-11 drop-shadow-sm"
                aria-hidden="true"
              >
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
            </div>

            <span className="text-3xl font-extrabold tracking-tight text-violet-200">
              WishJar
            </span>
          </a>

          <a
            href="/dashboard"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            Home
          </a>
        </header>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200">
  Home
</p>

          <h1 className="mb-4 text-5xl font-bold">
            {jar.title}
          </h1>

          <p className="max-w-3xl text-white/75">
            {jar.description || "No description added yet."}
          </p>

          <p className="mt-6 text-sm text-white/50">
            Owner: {email}
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Jar Progress</h2>
                <p className="mt-1 text-gray-500">
                  Track how this wish grows over time.
                </p>
              </div>

              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                Active
              </span>
            </div>

            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Supported so far
                </p>
                <p className="text-3xl font-bold">
                  $0
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-500">
                  Goal
                </p>
                <p className="text-3xl font-bold text-violet-700">
                  {jar.goal_amount
                    ? `$${jar.goal_amount.toLocaleString()}`
                    : "No goal"}
                </p>
              </div>
            </div>

            <div className="mb-6 h-4 rounded-full bg-gray-200">
              <div className="h-4 w-[4%] rounded-full bg-violet-600" />
            </div>

            <div className="rounded-2xl border border-dashed p-8 text-center">
              <h3 className="mb-2 text-xl font-bold">
                <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg">
  <div className="mb-5 flex items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-extrabold">Wishes inside this jar</h2>
      <p className="text-sm text-gray-500">
        Items, products, or goals connected to this WishJar.
      </p>
    </div>

    <a
      href={`/jars/${jar.id}/wishes/new`}
      className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
    >
      Add Wish Item
    </a>
  </div>

  {wishes.length === 0 ? (
    <p className="rounded-2xl bg-gray-50 p-5 text-gray-500">
      You have not added wishlist items yet.
    </p>
  ) : (
    <div className="space-y-4">
      {wishes.map((wish) => (
        <article
          key={wish.id}
          className="rounded-2xl border border-black/10 bg-gray-50 p-5"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">{wish.title}</h3>

              {wish.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {wish.description}
                </p>
              )}
            </div>

            {wish.price !== null && (
              <p className="rounded-full bg-white px-3 py-1 text-sm font-bold">
                ${wish.price}
              </p>
            )}
          </div>

          {wish.product_url && (
            <a
              href={wish.product_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-violet-700 underline"
            >
              Open product link
            </a>
          )}
        </article>
      ))}
    </div>
  )}
</section>
              </h3>

              <p className="mb-5 text-gray-500">
                You have not added wishlist items yet.
              </p>

             <a
  href={`/jars/${jar.id}/wishes/new`}
  className="inline-block rounded-full bg-black px-6 py-3 font-semibold text-white"
>
  Add Wish Item
</a>
            </div>
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold">
              Share Jar
            </h2>

            <p className="mb-5 text-gray-500">
              Share this jar with friends, family, or your community.
            </p>

            <div className="mb-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600 break-all">
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>

            <button
  onClick={handleCopyLink}
  className="mb-4 w-full rounded-full bg-violet-700 px-6 py-3 font-semibold text-white"
>
  {copied ? "Link Copied" : "Copy Share Link"}
</button>

            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-sm font-semibold text-violet-700">
                Next step
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Add product links and support options to make this jar useful.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}