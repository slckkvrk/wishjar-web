"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";

type Post = {
  id: string;
  user_id: string;
  jar_id: string | null;
  content: string;
  created_at: string;
  username: string;
  jar_title: string | null;
};

type TrendingJar = {
  id: string;
  title: string;
  category: string;
  goal_amount: number | null;
  username: string;
  wish_count: number;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingJars, setTrendingJars] = useState<TrendingJar[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .single();
      setCurrentUsername(myProfile?.username ?? null);

      // Trending jars: all active jars except own, sorted by wish count
      const { data: allJars } = await supabase
        .from("jars")
        .select("id, title, category, goal_amount, user_id")
        .eq("status", "active")
        .neq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (allJars && allJars.length > 0) {
        const jarIds = allJars.map((j) => j.id);
        const ownerIds = [...new Set(allJars.map((j) => j.user_id))];

        const [{ data: wishCounts }, { data: jarProfiles }] = await Promise.all([
          supabase.from("wishes").select("jar_id").in("jar_id", jarIds),
          supabase.from("profiles").select("id, username").in("id", ownerIds),
        ]);

        const countMap: Record<string, number> = {};
        (wishCounts ?? []).forEach((w) => {
          countMap[w.jar_id] = (countMap[w.jar_id] ?? 0) + 1;
        });
        const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));

        const trending: TrendingJar[] = allJars
          .map((j) => ({
            id: j.id,
            title: j.title,
            category: j.category,
            goal_amount: j.goal_amount,
            username: profileMap[j.user_id] ?? "unknown",
            wish_count: countMap[j.id] ?? 0,
          }))
          .sort((a, b) => b.wish_count - a.wish_count)
          .slice(0, 5);

        setTrendingJars(trending);
      }

      const { data: rawPosts } = await supabase
        .from("posts")
        .select("id, user_id, jar_id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!rawPosts || rawPosts.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
      const jarIds = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);

      const [{ data: profiles }, { data: jars }] = await Promise.all([
        supabase.from("profiles").select("id, username").in("id", userIds),
        jarIds.length > 0
          ? supabase.from("jars").select("id, title").in("id", jarIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
      const jarMap = Object.fromEntries((jars ?? []).map((j) => [j.id, j.title]));

      const merged: Post[] = rawPosts.map((p) => ({
        ...p,
        username: profileMap[p.user_id] ?? "unknown",
        jar_title: p.jar_id ? (jarMap[p.jar_id] ?? null) : null,
      }));

      setPosts(merged);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading feed...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
              <defs>
                <linearGradient id="jgf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jgf)" />
              <path d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z" fill="white" />
            </svg>
            <span className="text-2xl font-extrabold text-violet-200">WishJar</span>
          </a>

          <div className="flex items-center gap-3">
            {currentUsername && (
              <a
                href={`/u/${currentUsername}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                @{currentUsername}
              </a>
            )}
            <a
              href="/dashboard"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
            >
              Home
            </a>
          </div>
        </header>

        {/* Trending Jars */}
        {trendingJars.length > 0 && (
          <section className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-violet-300">
              Trending Jars
            </h2>
            <div className="space-y-3">
              {trendingJars.map((jar) => (
                <a
                  key={jar.id}
                  href={`/jars/${jar.id}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 hover:bg-white/20"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{jar.title}</span>
                      <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-xs font-semibold text-violet-200">
                        {jar.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">
                      by @{jar.username} · {jar.wish_count} item{jar.wish_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {jar.goal_amount && (
                    <span className="shrink-0 text-sm font-bold text-violet-300">
                      ${jar.goal_amount.toLocaleString()}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-12 text-center backdrop-blur">
              <p className="text-lg font-semibold text-white">No posts yet.</p>
              <p className="mt-2 text-sm text-white/50">
                Be the first — go to your profile and share a post.
              </p>
              {currentUsername && (
                <a
                  href={`/u/${currentUsername}`}
                  className="mt-6 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white"
                >
                  Go to my profile
                </a>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white backdrop-blur"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                    {post.username[0].toUpperCase()}
                  </div>
                  <div>
                    <a
                      href={`/u/${post.username}`}
                      className="font-bold hover:text-violet-300"
                    >
                      @{post.username}
                    </a>
                    <p className="text-xs text-white/40">{timeAgo(post.created_at)}</p>
                  </div>
                </div>

                <p className="mb-3 leading-7 text-white/90">{post.content}</p>

                {post.jar_title && post.jar_id && (
                  <a
                    href={`/jars/${post.jar_id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/20"
                  >
                    <span>🫙</span>
                    {post.jar_title}
                  </a>
                )}
              </article>
            ))
          )}
        </div>

      </div>
    </main>
  );
}
