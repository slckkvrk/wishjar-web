"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
  created_at: string;
};

const MAX_JARS = 3;

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(userData.user.email ?? null);

      const { data: jarsData, error } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
      }

      setJars(jarsData ?? []);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading WishJar...</p>
      </main>
    );
  }

  const atJarLimit = jars.length >= MAX_JARS;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-sm" aria-hidden="true">
              <defs>
                <linearGradient id="jarGradientDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jarGradientDash)" />
              <path
                d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
                fill="white"
              />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-violet-200">WishJar</span>
          </a>

          <button
            onClick={handleLogout}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            Logout
          </button>
        </header>

        {/* Welcome banner */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-300">
                Home
              </p>
              <h1 className="mb-2 text-4xl font-bold md:text-5xl">Welcome back.</h1>
              <p className="text-sm text-white/60">{email}</p>
            </div>

            {atJarLimit ? (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center text-sm text-white/70">
                You have {jars.length} active jars. <br />
                <span className="font-semibold text-violet-300">Complete one to create a new jar.</span>
              </div>
            ) : (
              <a
                href="/jars/new"
                className="rounded-full bg-white px-6 py-3 text-center font-bold text-slate-950"
              >
                + Create New Jar
              </a>
            )}
          </div>
        </section>

        {/* Jars list */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b pb-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Your Jars</h2>
              <p className="mt-1 text-sm text-gray-500">
                {jars.length === 0
                  ? "No jars yet. Create your first one."
                  : "Tap a jar to see and manage its wish items."}
              </p>
            </div>

            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              {jars.length} / {MAX_JARS} active
            </div>
          </div>

          {jars.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="mb-5 text-gray-500">You have no jars yet.</p>
              <a
                href="/jars/new"
                className="inline-block rounded-full bg-violet-700 px-6 py-3 font-semibold text-white"
              >
                Create Your First Jar
              </a>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {jars.map((jar) => (
                <div
                  key={jar.id}
                  className="rounded-2xl border bg-gradient-to-br from-white to-violet-50 p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold">{jar.title}</h3>
                    <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {jar.category}
                    </span>
                  </div>

                  {jar.description && (
                    <p className="mb-4 text-sm leading-6 text-gray-600 line-clamp-2">
                      {jar.description}
                    </p>
                  )}

                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Goal</span>
                    <span className="font-bold text-violet-700">
                      {jar.goal_amount ? `$${jar.goal_amount.toLocaleString()}` : "No goal set"}
                    </span>
                  </div>

                  <a
                    href={`/jars/${jar.id}`}
                    className="block w-full rounded-full border border-violet-200 bg-white py-2 text-center text-sm font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    View Jar →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
