"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import BottomNav from "@/components/BottomNav";
import { interleaveByRatio } from "@/lib/interleave";

type DiscoverJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string; follower_count: number;
  completed_at?: string | null;
};

export default function JarsPage() {
  const [jars, setJars] = useState<DiscoverJar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setCurrentUserId(auth.userId);

      const { data: followRows } = await supabase
        .from("jar_follows").select("jar_id").eq("user_id", auth.userId);
      const followedJarIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedSet = new Set(followedJarIds);
      setFollowedIds(followedSet);

      const jarColumns = "id, title, description, category, goal_amount, user_id, follower_count, status";

      const [{ data: followedJarsRaw }, { data: popularJarsRaw }, { data: completedJarsRaw }] = await Promise.all([
        followedJarIds.length > 0
          ? supabase.from("jars").select(jarColumns).in("id", followedJarIds).eq("status", "active").order("created_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        supabase.from("jars").select(jarColumns).eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(`${jarColumns}, completed_at`).eq("status", "completed").neq("user_id", auth.userId)
          .order("completed_at", { ascending: false }).limit(20),
      ]);

      const allRaw = [
        ...(followedJarsRaw ?? []), ...(popularJarsRaw ?? []), ...(completedJarsRaw ?? []),
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
      (wishData ?? []).forEach((w) => { valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0); });
      setWishValueMap(valueMap);

      const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));
      const toDiscoverJar = (j: (typeof allRaw)[number]): DiscoverJar => ({
        id: j.id, title: j.title, description: j.description ?? null,
        category: j.category, goal_amount: j.goal_amount, status: j.status,
        username: profileMap[j.user_id] ?? "?", follower_count: j.follower_count ?? 0,
        completed_at: j.completed_at ?? null,
      });

      const followedBucket = (followedJarsRaw ?? []).map((j) => toDiscoverJar(j as (typeof allRaw)[number]));
      const popularBucket = (popularJarsRaw ?? [])
        .filter((j) => !followedSet.has(j.id))
        .map((j) => toDiscoverJar(j as (typeof allRaw)[number]));
      const completedBucket = (completedJarsRaw ?? []).map((j) => toDiscoverJar(j as (typeof allRaw)[number]));

      setJars(interleaveByRatio([followedBucket, popularBucket, completedBucket], [0, 1, 0, 1, 2]));
      setLoading(false);
    };
    load();
  }, []);

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

      <div className="md:hidden px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-wj-text">Discover Jars</h1>
        <p className="text-xs text-wj-muted mt-0.5">Followed, popular, and completed jars</p>
      </div>

      <div className="px-4 md:mx-auto md:max-w-5xl md:py-6">
        <div className="hidden md:block mb-5">
          <h1 className="text-xl font-bold text-wj-text">Discover Jars</h1>
          <p className="text-sm text-wj-muted mt-0.5">Followed, popular, and completed jars</p>
        </div>

        {jars.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-wj-muted">No jars to discover yet. Follow some jars to see updates here.</p>
          </div>
        ) : (
          jars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={jar}
              totalWishValue={wishValueMap[jar.id] ?? 0}
              followerCount={jar.follower_count}
              isFollowing={followedIds.has(jar.id)}
              currentUserId={currentUserId ?? undefined}
            />
          ))
        )}
      </div>

      <BottomNav active="jars" />
    </div>
  );
}
