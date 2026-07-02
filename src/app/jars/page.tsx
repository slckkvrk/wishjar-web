"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import { completedLabel } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; created_at: string; completed_at: string | null;
};
const MAX_JARS = 3;

export default function JarsPage() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setIsPremium(auth.isPremium);
      const { data } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at, completed_at")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false });
      setJars(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = !isPremium && activeJars.length >= MAX_JARS;

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wj-text">My Jars</h1>
          <p className="text-xs text-wj-muted mt-0.5">{activeJars.length}/{MAX_JARS} active</p>
        </div>
        {!atLimit && (
          <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">+ New</a>
        )}
      </div>

      <div className="px-4 md:mx-auto md:max-w-5xl md:py-6">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-wj-text">
            My Jars
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-wj-card text-wj-muted">
              {activeJars.length}/{MAX_JARS}
            </span>
          </h1>
          {!atLimit && (
            <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">+ New jar</a>
          )}
        </div>

        {jars.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🫙</div>
            <p className="text-sm text-wj-muted mb-4">No jars yet. Create your first one!</p>
            <a href="/jars/new" className="inline-block px-6 py-3 rounded-2xl text-sm font-bold text-white bg-wj-plum">
              Create jar
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {jars.map((jar) => (
              <a
                key={jar.id}
                href={`/jars/${jar.id}`}
                className="block rounded-2xl p-4"
                style={{
                  backgroundColor: jar.status === "completed" ? "#F0D080" : "#FDFAF3",
                  border: `1px solid ${jar.status === "completed" ? "#EDD98A" : "#E8DCBB"}`,
                  boxShadow: "var(--wj-shadow)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base font-bold text-wj-text">{jar.title}</span>
                      {jar.status === "completed" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-wj-gold">
                          {completedLabel(jar.completed_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
                      {jar.goal_amount && (
                        <span className="text-xs text-wj-muted">Goal: ${jar.goal_amount.toLocaleString()}</span>
                      )}
                    </div>
                    {jar.description && (
                      <p className="mt-1.5 text-xs text-wj-muted line-clamp-1">{jar.description}</p>
                    )}
                  </div>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5 text-wj-muted" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}

        {atLimit && (
          <p className="mt-4 text-xs text-center text-wj-muted">
            {activeJars.length} active jars (max {MAX_JARS}). Complete or delete one to create more.
          </p>
        )}
      </div>

      <BottomNav active="jars" />
    </div>
  );
}
