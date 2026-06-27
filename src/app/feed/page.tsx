"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setCurrentUserId(userData.user.id);

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
        (wishCounts ?? []).forEach((w) => { countMap[w.jar_id] = (countMap[w.jar_id] ?? 0) + 1; });
        const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));
        const trending: TrendingJar[] = allJars
          .map((j) => ({ id: j.id, title: j.title, category: j.category, goal_amount: j.goal_amount, username: profileMap[j.user_id] ?? "?", wish_count: countMap[j.id] ?? 0 }))
          .sort((a, b) => b.wish_count - a.wish_count)
          .slice(0, 6);
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
      const jarIds2 = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);
      const [{ data: profiles }, { data: jars }] = await Promise.all([
        supabase.from("profiles").select("id, username").in("id", userIds),
        jarIds2.length > 0 ? supabase.from("jars").select("id, title").in("id", jarIds2) : Promise.resolve({ data: [] }),
      ]);
      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
      const jarMap = Object.fromEntries((jars ?? []).map((j) => [j.id, j.title]));
      setPosts(rawPosts.map((p) => ({ ...p, username: profileMap[p.user_id] ?? "unknown", jar_title: p.jar_id ? (jarMap[p.jar_id] ?? null) : null })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader activeTab="feed" />
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">Loading feed…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="feed" />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">Feed</p>

        <div className="grid gap-5 md:grid-cols-[1fr_260px]">

          {/* Posts */}
          <div>
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h1 className="text-sm font-bold text-gray-800">Community Posts</h1>
              </div>

              {posts.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-gray-500">No posts yet. Be the first to share something.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <li key={post.id} className="px-4 py-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-violet-600 text-xs font-bold text-white">
                          {post.username[0].toUpperCase()}
                        </div>
                        <div>
                          <a href={`/u/${post.username}`} className="text-sm font-semibold text-violet-700 hover:underline">
                            @{post.username}
                          </a>
                          <span className="ml-2 text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-gray-800">{post.content}</p>
                      {post.jar_title && post.jar_id && (
                        <div className="mt-2">
                          <a
                            href={`/jars/${post.jar_id}`}
                            className="inline-block rounded border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            🫙 {post.jar_title}
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {trendingJars.length > 0 && (
              <div className="rounded border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Trending Jars</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {trendingJars.map((jar) => (
                    <li key={jar.id} className="px-4 py-3 hover:bg-gray-50">
                      <a href={`/jars/${jar.id}`} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-violet-700 hover:underline">{jar.title}</p>
                            <p className="text-xs text-gray-400">
                              by @{jar.username} · {jar.wish_count} item{jar.wish_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {jar.goal_amount && (
                            <span className="shrink-0 text-xs font-semibold text-gray-600">
                              ${jar.goal_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Share</span>
              </div>
              <div className="px-4 py-3 text-xs text-gray-500">
                Go to your profile to post an update or link a jar.
                <div className="mt-2">
                  <a href="/dashboard" className="block text-violet-700 hover:underline">→ My jars</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
