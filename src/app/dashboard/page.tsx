"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
  status: string;
  created_at: string;
};

const MAX_JARS = 3;

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setEmail(userData.user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .single();
      setUsername(profile?.username ?? null);

      const { data: jarsData, error } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error.message);
      setJars(jarsData ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader activeTab="home" />
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = activeJars.length >= MAX_JARS;

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Breadcrumb */}
        <p className="mb-4 text-xs text-gray-400">Home</p>

        <div className="grid gap-5 md:grid-cols-[1fr_260px]">

          {/* Main: jar list */}
          <div>
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h1 className="text-sm font-bold text-gray-800">
                  Your Jars
                  <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-normal text-gray-600">
                    {activeJars.length}/{MAX_JARS} active
                  </span>
                </h1>
                {atLimit ? (
                  <span className="text-xs text-gray-400">Limit reached</span>
                ) : (
                  <a
                    href="/jars/new"
                    className="rounded bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800"
                  >
                    + New jar
                  </a>
                )}
              </div>

              {jars.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="mb-3 text-sm text-gray-500">You haven&apos;t created any jars yet.</p>
                  <a
                    href="/jars/new"
                    className="rounded bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    Create your first jar
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {jars.map((jar) => (
                    <li key={jar.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/jars/${jar.id}`}
                            className="text-sm font-semibold text-violet-700 hover:underline"
                          >
                            {jar.title}
                          </a>
                          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700">
                            {jar.category}
                          </span>
                          {jar.status === "completed" && (
                            <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                              Completed
                            </span>
                          )}
                        </div>
                        {jar.description && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">{jar.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {jar.goal_amount && (
                          <span className="text-xs text-gray-500">
                            Goal: ${jar.goal_amount.toLocaleString()}
                          </span>
                        )}
                        <a
                          href={`/jars/${jar.id}`}
                          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {atLimit && (
              <p className="mt-2 text-xs text-gray-400">
                You have {activeJars.length} active jars (limit is {MAX_JARS}). Complete or delete a jar to create a new one.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Account info */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Account</span>
              </div>
              <div className="px-4 py-3 text-xs text-gray-600 space-y-2">
                {username && (
                  <div>
                    <span className="text-gray-400">Username: </span>
                    <a href={`/u/${username}`} className="font-semibold text-violet-700 hover:underline">
                      @{username}
                    </a>
                  </div>
                )}
                <div className="truncate">
                  <span className="text-gray-400">Email: </span>
                  <span>{email}</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Quick links</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {[
                  { href: "/feed", label: "Community feed" },
                  { href: "/jars/new", label: "Create new jar" },
                  { href: username ? `/u/${username}` : "#", label: "My profile" },
                  { href: "/settings/profile", label: "Settings" },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="block px-4 py-2.5 text-xs text-violet-700 hover:bg-gray-50 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      <footer className="mt-10 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-gray-400">
          <span>© 2026 WishJar</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-600">Privacy</a>
            <a href="/terms" className="hover:text-gray-600">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
