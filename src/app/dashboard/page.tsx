"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import HomeHeroCard from "@/components/HomeHeroCard";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";

type Jar = { id: string; title: string };
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; avatarUrl: string | null; jar_title: string | null;
};

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [manifestLine1, setManifestLine1] = useState<string | null>(null);
  const [manifestLine2, setManifestLine2] = useState<string | null>(null);
  const [myJars, setMyJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      setUsername(auth.username);

      const [{ data: profile }, { data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase.from("profiles").select("avatar_url, manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, user_id, jar_id, content, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(profile?.manifest_line1 ?? null);
      setManifestLine2(profile?.manifest_line2 ?? null);
      setMyJars(jarsData ?? []);

      if (rawPosts && rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);
        const [{ data: profiles }, { data: jarsForPosts }] = await Promise.all([
          supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
          jarIds.length > 0 ? supabase.from("jars").select("id, title").in("id", jarIds) : Promise.resolve({ data: [] }),
        ]);
        const pMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, { username: p.username as string, avatarUrl: (p.avatar_url ?? null) as string | null }])
        );
        const jMap = Object.fromEntries((jarsForPosts ?? []).map((j) => [j.id, j.title as string]));
        setPosts(rawPosts.map((p) => ({
          ...p,
          username: pMap[p.user_id]?.username ?? "unknown",
          avatarUrl: pMap[p.user_id]?.avatarUrl ?? null,
          jar_title: p.jar_id ? (jMap[p.jar_id] ?? null) : null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
    setPosts((prev) => [
      { ...post, user_id: userId ?? "", username: username ?? "you", avatarUrl },
      ...prev,
    ]);
  };

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

      <HomeHeroCard
        userId={userId!}
        username={username ?? "there"}
        avatarUrl={avatarUrl}
        manifestLine1={manifestLine1}
        manifestLine2={manifestLine2}
      />

      <div className="px-4 md:mx-auto md:max-w-5xl space-y-3">
        <PostComposer userId={userId!} jars={myJars} onPosted={handlePosted} />

        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              username={post.username}
              avatarUrl={post.avatarUrl}
              createdAt={post.created_at}
              content={post.content}
              jarId={post.jar_id}
              jarTitle={post.jar_title}
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
