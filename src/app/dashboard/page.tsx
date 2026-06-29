"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; created_at: string;
};
type Tab = "all" | "jars" | "posts" | "complete";
const MAX_JARS = 3;

export default function DashboardPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [totalWishes, setTotalWishes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
      setUsername(profile?.username ?? null);

      const { data: jarsData } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      const jarsArr = jarsData ?? [];
      setJars(jarsArr);

      if (jarsArr.length > 0) {
        const jarIds = jarsArr.map((j) => j.id);
        const { data: wishes } = await supabase
          .from("wishes").select("jar_id, price").in("jar_id", jarIds);
        const valueMap: Record<string, number> = {};
        let count = 0;
        (wishes ?? []).forEach((w) => {
          valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0);
          count++;
        });
        setWishValueMap(valueMap);
        setTotalWishes(count);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredJars = jars.filter((j) => {
    if (tab === "jars") return j.status !== "completed";
    if (tab === "complete") return j.status === "completed";
    return true;
  });

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = activeJars.length >= MAX_JARS;

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader activeTab="home" />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />

      {/* Mobile page header */}
      <div className="md:hidden px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white bg-wj-plum shrink-0">
              {username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-wj-text">Hi, {username} 👋</h1>
              <p className="text-xs text-wj-muted">
                {totalWishes} {totalWishes === 1 ? "wish" : "wishes"} are growing today
              </p>
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-wj-card border border-wj-card-border"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-wj-text" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wj-plum-mid"></span>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3 mb-4">
          {!atLimit ? (
            <a href="/jars/new"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-gold-card border border-wj-gold">
              🫙 Create Jar
            </a>
          ) : (
            <span className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-gold-card border border-wj-gold opacity-40">
              🫙 Limit Reached
            </span>
          )}
          <a href={username ? `/u/${username}` : "#"}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-card border border-wj-card-border">
            👥 Share Profile
          </a>
        </div>

        {/* Tab pills */}
        <div className="flex items-center rounded-2xl p-1 gap-1 bg-wj-card border border-wj-card-border">
          {(["all", "jars", "posts", "complete"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
              style={{
                backgroundColor: tab === t ? "#3D1A24" : "transparent",
                color: tab === t ? "white" : "#9B7E6A",
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex mx-auto max-w-5xl px-4 pt-6 pb-2 items-center justify-between">
        <h1 className="text-xl font-bold text-wj-text">Your Timeline</h1>
        {!atLimit && (
          <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">
            + New jar
          </a>
        )}
      </div>

      {/* Jar cards */}
      <div className="px-4 md:mx-auto md:max-w-5xl">
        {tab === "posts" ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted">
              Posts feed coming soon — check the{" "}
              <a href="/feed" className="underline text-wj-plum">Community Feed</a>
            </p>
          </div>
        ) : filteredJars.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted mb-4">
              {tab === "complete" ? "No completed jars yet." : "You haven't created any jars yet."}
            </p>
            {!atLimit && tab !== "complete" && (
              <a href="/jars/new" className="inline-block px-6 py-3 rounded-2xl text-sm font-bold text-white bg-wj-plum">
                Create your first jar
              </a>
            )}
          </div>
        ) : (
          filteredJars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={{ ...jar, username: username ?? "You" }}
              totalWishValue={wishValueMap[jar.id] ?? 0}
              isOwn
            />
          ))
        )}
      </div>

      <footer className="hidden md:block mt-10 border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-wj-muted">
          <span>© 2026 WishJar</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-wj-text">Privacy</a>
            <a href="/terms" className="hover:text-wj-text">Terms</a>
          </div>
        </div>
      </footer>

      <BottomNav active="home" />
    </div>
  );
}
