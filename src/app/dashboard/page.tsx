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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center">
              <svg
                viewBox="0 0 64 64"
                className="h-11 w-11 drop-shadow-sm"
                aria-hidden="true"
              >
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
            </div>

            <span className="text-3xl font-extrabold tracking-tight text-violet-200">
              WishJar
            </span>
          </a>

          <button
            onClick={handleLogout}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            Logout
          </button>
        </header>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-200">
            Dashboard
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="mb-3 text-4xl font-bold md:text-5xl">
                Welcome back.
              </h1>

              <p className="max-w-2xl text-white/70">
                Your account is active: {email}
              </p>
            </div>

            <a
              href="/jars/new"
              className="rounded-full bg-white px-6 py-3 text-center font-bold text-slate-950"
            >
              Create New Jar
            </a>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b pb-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Your Jars</h2>
              <p className="mt-1 text-gray-500">
                Manage your active wishes and keep building.
              </p>
            </div>

            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              {jars.length} active jar{jars.length === 1 ? "" : "s"}
            </div>
          </div>

          {jars.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="mb-5 text-gray-600">
                You do not have any jars yet.
              </p>

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
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold">{jar.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Created jar
                      </p>
                    </div>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                      {jar.category}
                    </span>
                  </div>

                  {jar.description && (
                    <p className="mb-5 leading-7 text-gray-600">
                      {jar.description}
                    </p>
                  )}

                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">
                      Goal Amount
                    </span>
                    <span className="font-bold text-violet-700">
                      {jar.goal_amount
                        ? `$${jar.goal_amount.toLocaleString()}`
                        : "No goal"}
                    </span>
                  </div>

                  <div className="mb-4 h-3 rounded-full bg-gray-200">
                    <div className="h-3 w-[8%] rounded-full bg-violet-600" />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      $0 supported so far
                    </p>

                    <button className="rounded-full border px-4 py-2 text-sm font-semibold">
                      View Jar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}