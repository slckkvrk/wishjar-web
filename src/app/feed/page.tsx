"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import { timeAgo } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import AvatarCircle from "@/components/AvatarCircle";
import BottomNav from "@/components/BottomNav";
import { interleaveByRatio } from "@/lib/interleave";

type FeedJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string; follower_count: number;
  completed_at?: string | null;
};
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; jar_title: string | null;
};

export default function FeedPage() {
  const [feedJars, setFeedJars] = useState<FeedJar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [popularJars, setPopularJars] = useState<FeedJar[]>([]);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;

      const { data: followRows } = await supabase
        .from("jar_follows").select("jar_id").eq("user_id", auth.userId);
      const followedIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedSet = new Set(followedIds);
      setFollowedIds(followedSet);
      setCurrentUserId(auth.userId);

      const jarColumns = "id, title, description, category, goal_amount, user_id, follower_count, status";

      const [{ data: followedJarsRaw }, { data: popularJarsRaw }, { data: completedJarsRaw }] = await Promise.all([
        followedIds.length > 0
          ? supabase.from("jars").select(jarColumns)
              .in("id", followedIds).eq("status", "active")
              .order("created_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        supabase.from("jars").select(jarColumns)
          .eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(`${jarColumns}, completed_at`)
          .eq("status", "completed").neq("user_id", auth.userId)
          .order("completed_at", { ascending: false }).limit(20),
      ]);

      const allRaw = [
        ...(followedJarsRaw ?? []),
        ...(popularJarsRaw ?? []),
        ...(completedJarsRaw ?? []),
      ] as Array<{
        id: string; title: string; description: string | null; category: string;
        goal_amount: number | null; user_id: string; follower_count: number;
        status: string; completed_at?: string | null;
      }>;

      const jarIds = [...new Set(allRaw.map((j) => j.id))];
      const ownerIds = [...new Set(allRaw.map((j) => j.user_id))];

      const [{ data: wishData }, { data: jarProfiles }] = await Promise.all([
        jarIds.length > 0 ? supabase.from("wishes").select("jar_id, price").in("jar_id", jarIds) : Promise.resolve({ data: [] }),
        ownerIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", ownerIds) : Promise.resolve({ data: [] }),
      ]);

      const valueMap: Record<string, number> = {};
      (wishData ?? []).forEach((w) => {
        valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0);
      });
      setWishValueMap(valueMap);

      const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));

      const toFeedJar = (j: (typeof allRaw)[number]): FeedJar => ({
        id: j.id, title: j.title, description: j.description ?? null,
        category: j.category, goal_amount: j.goal_amount,
        status: j.status, username: profileMap[j.user_id] ?? "?",
        follower_count: j.follower_count ?? 0,
        completed_at: j.completed_at ?? null,
      });

      const followedBucket = (followedJarsRaw ?? []).map((j) => toFeedJar(j as (typeof allRaw)[number]));
      // Both buckets draw from status='active' jars, so a followed jar can also rank as
      // popular — exclude anything already shown in followedBucket so it isn't duplicated.
      const popularBucket = (popularJarsRaw ?? [])
        .filter((j) => !followedSet.has(j.id))
        .map((j) => toFeedJar(j as (typeof allRaw)[number]));
      const completedBucket = (completedJarsRaw ?? []).map((j) => toFeedJar(j as (typeof allRaw)[number]));

      setPopularJars(popularBucket);
      setFeedJars(interleaveByRatio([followedBucket, popularBucket, completedBucket], [0, 1, 0, 1, 2]));

      const { data: rawPosts } = await supabase
        .from("posts").select("id, user_id, jar_id, content, created_at")
        .order("created_at", { ascending: false }).limit(50);

      if (rawPosts && rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds2 = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);
        const [{ data: profiles }, { data: jars }] = await Promise.all([
          supabase.from("profiles").select("id, username").in("id", userIds),
          jarIds2.length > 0 ? supabase.from("jars").select("id, title").in("id", jarIds2) : Promise.resolve({ data: [] }),
        ]);
        const pMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
        const jMap = Object.fromEntries((jars ?? []).map((j) => [j.id, j.title]));
        setPosts(rawPosts.map((p) => ({
          ...p, username: pMap[p.user_id] ?? "unknown",
          jar_title: p.jar_id ? (jMap[p.jar_id] ?? null) : null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader activeTab="feed" />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading feed…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="feed" />

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-wj-text">Community Feed</h1>
        <p className="text-xs text-wj-muted mt-0.5">Discover what others are wishing for</p>
      </div>

      <div className="md:mx-auto md:max-w-5xl md:px-4 md:py-6 md:grid md:gap-5 md:grid-cols-[1fr_260px]">
        {/* Main column */}
        <div className="px-4 md:px-0">
          {feedJars.length === 0 && posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-wj-muted">No community jars yet. Be the first to create one!</p>
            </div>
          ) : (
            <>
              {feedJars.map((jar) => (
                <JarCard
                  key={jar.id}
                  jar={jar}
                  totalWishValue={wishValueMap[jar.id] ?? 0}
                  followerCount={jar.follower_count}
                  isFollowing={followedIds.has(jar.id)}
                  currentUserId={currentUserId ?? undefined}
                />
              ))}

              {posts.length > 0 && (
                <div className="mt-2">
                  <h2 className="text-sm font-bold text-wj-text mb-3">Community Posts</h2>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <AvatarCircle name={post.username} size="sm" />
                          <div>
                            <a href={`/u/${post.username}`} className="text-sm font-semibold text-wj-plum hover:underline">
                              @{post.username}
                            </a>
                            <span className="ml-2 text-xs text-wj-muted">{timeAgo(post.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-wj-text leading-relaxed">{post.content}</p>
                        {post.jar_title && post.jar_id && (
                          <a href={`/jars/${post.jar_id}`} className="mt-2 inline-block text-xs text-wj-plum hover:underline">
                            → {post.jar_title}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block space-y-4">
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h2 className="text-sm font-bold text-wj-text mb-3">Trending Jars</h2>
            {popularJars.length === 0 ? (
              <p className="text-xs text-wj-muted">No jars yet.</p>
            ) : popularJars.slice(0, 5).map((jar) => (
              <a key={jar.id} href={`/jars/${jar.id}`} className="flex items-center gap-2 py-2 border-b border-wj-card-border last:border-0 hover:opacity-70">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-wj-plum shrink-0">
                  {jar.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-wj-text truncate">{jar.title}</p>
                  <p className="text-xs text-wj-muted">@{jar.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
