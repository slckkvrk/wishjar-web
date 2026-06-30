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
type Tab = "all" | "jars" | "complete";
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
              <h1 className="text-xl font-bold text-wj-text">Hi, {username ?? "there"} 👋</h1>
              <p className="text-xs text-wj-muted">
                {totalWishes} {totalWishes === 1 ? "wish" : "wishes"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings — gear icon → /settings/profile */}
            <a href="/settings/profile"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-wj-card border border-wj-card-border"
              aria-label="Settings"
              title="Settings"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-wj-text" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>
            {/* Bell → feed */}
            <a href="/feed"
              className="w-9 h-9 rounded-xl flex items-center justify-center relative bg-wj-card border border-wj-card-border"
              aria-label="Community Feed"
              title="Community Feed"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-wj-text" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wj-plum-mid"></span>
            </a>
          </div>
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
          <a
            href={username ? `/u/${username}` : "/setup/username"}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-card border border-wj-card-border"
          >
            👤 My Profile
          </a>
        </div>

        {/* Tab pills */}
        <div className="flex items-center rounded-2xl p-1 gap-1 bg-wj-card border border-wj-card-border">
          {(["all", "jars", "complete"] as Tab[]).map((t) => (
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
        <div className="flex items-center gap-3">
          {/* Tab pills desktop */}
          <div className="flex items-center rounded-2xl p-1 gap-1 bg-wj-card border border-wj-card-border">
            {(["all", "jars", "complete"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
                style={{
                  backgroundColor: tab === t ? "#3D1A24" : "transparent",
                  color: tab === t ? "white" : "#9B7E6A",
                }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {!atLimit && (
            <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">
              + New jar
            </a>
          )}
        </div>
      </div>

      {/* Jar cards */}
      <div className="px-4 md:mx-auto md:max-w-5xl">
        {jars.length === 0 ? (
          /* Onboarding banner — shown when user has zero jars */
          <div className="rounded-2xl border-2 border-wj-gold bg-wj-card mt-2 mb-4 overflow-hidden" style={{ boxShadow: "var(--wj-shadow)" }}>
            <div className="px-5 pt-5 pb-4 border-b border-wj-card-border" style={{ background: "#F0D080" }}>
              <h2 className="text-xl font-bold text-wj-text mb-1">Welcome to WishJar 🫙</h2>
              <p className="text-sm text-wj-text/80">Create a jar for a goal, add wishes inside, and share it with people who care.</p>
            </div>
            <div className="px-5 py-4">
              <div className="grid gap-3 md:grid-cols-3 mb-5">
                {[
                  { step: "1", title: "Create a jar", desc: "Name your goal, pick a category, set a target." },
                  { step: "2", title: "Add wishes", desc: "Add items with names, prices, and links." },
                  { step: "3", title: "Share", desc: "Share your profile link with friends." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-wj-plum shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-wj-text">{item.title}</p>
                      <p className="text-xs text-wj-muted leading-5 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/jars/new"
                className="inline-block rounded-2xl bg-wj-plum px-6 py-3 text-sm font-bold text-white hover:bg-wj-plum-mid">
                Create Jar →
              </a>
            </div>
          </div>
        ) : filteredJars.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted mb-4">
              {tab === "complete" ? "No completed jars yet." : "No jars in this view."}
            </p>
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
          <span>© 2026 WishJar · Created by <strong className="text-wj-text">Selçuk Kıvrak</strong> · Built with AI</span>
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
