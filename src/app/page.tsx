"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import { interleaveByRatio } from "@/lib/interleave";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import HomeHeroCard from "@/components/HomeHeroCard";
import HowItWorksBar from "@/components/HowItWorksBar";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import JarIllustration from "@/components/JarIllustration";

type Jar = { id: string; title: string };
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; avatarUrl: string | null; jar_title: string | null;
};

export default function RootPage() {
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [manifestLine1, setManifestLine1] = useState<string | null>(null);
  const [manifestLine2, setManifestLine2] = useState<string | null>(null);
  const [myJars, setMyJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setCheckedAuth(true); return; }
      setSignedIn(true);

      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      setUsername(auth.username);

      const [{ data: profile }, { data: manifest }, { data: myJarsData }, { data: followRows }, { data: unreadNotifications }] = await Promise.all([
        supabase.from("profiles").select("avatar_url").eq("id", auth.userId).single(),
        supabase.from("profiles_private").select("manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("jar_follows").select("jar_id").eq("user_id", auth.userId),
        supabase.from("notifications").select("id").eq("recipient_id", auth.userId).is("read_at", null).limit(1),
      ]);

      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(manifest?.manifest_line1 ?? null);
      setManifestLine2(manifest?.manifest_line2 ?? null);
      setMyJars(myJarsData ?? []);
      setHasUnreadNotifications((unreadNotifications ?? []).length > 0);

      const ownJarIds = (myJarsData ?? []).map((j) => j.id);
      const followedJarIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedOrOwnIds = [...new Set([...ownJarIds, ...followedJarIds])];
      const followedSet = new Set(followedJarIds);

      const jarColumns = "id, follower_count";
      const [{ data: followedOrOwnJars }, { data: popularJars }, { data: completedJars }] = await Promise.all([
        followedOrOwnIds.length > 0
          ? supabase.from("jars").select(jarColumns).in("id", followedOrOwnIds).eq("status", "active")
          : Promise.resolve({ data: [] as { id: string; follower_count: number }[] }),
        supabase.from("jars").select(jarColumns).eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(jarColumns).eq("status", "completed").neq("user_id", auth.userId)
          .order("created_at", { ascending: false }).limit(20),
      ]);

      const followedOrOwnIdSet = new Set((followedOrOwnJars ?? []).map((j) => j.id));
      const popularIds = (popularJars ?? [])
        .filter((j) => !followedOrOwnIdSet.has(j.id) && !followedSet.has(j.id))
        .map((j) => j.id);
      const completedIds = (completedJars ?? []).map((j) => j.id);

      const [{ data: followedPosts }, { data: popularPosts }, { data: completedPosts }] = await Promise.all([
        followedOrOwnIdSet.size > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", [...followedOrOwnIdSet]).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
        popularIds.length > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", popularIds).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
        completedIds.length > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", completedIds).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
      ]);

      const rawPosts = interleaveByRatio(
        [followedPosts ?? [], popularPosts ?? [], completedPosts ?? []],
        [0, 1, 0, 1, 2]
      );

      if (rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds = [...new Set(rawPosts.map((p) => p.jar_id).filter(Boolean))] as string[];
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
      setCheckedAuth(true);
    };
    load();
  }, []);

  const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
    setPosts((prev) => [
      { ...post, user_id: userId ?? "", username: username ?? "you", avatarUrl },
      ...prev,
    ]);
  };

  if (!checkedAuth) {
    return <div className="min-h-screen bg-wj-cream" />;
  }

  if (!signedIn) {
    return <LandingPage />;
  }

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
        hasUnreadNotifications={hasUnreadNotifications}
      />

      <div className="px-4 md:mx-auto md:max-w-5xl space-y-3">
        <HowItWorksBar />
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

function LandingPage() {
  return (
    <div className="min-h-screen bg-wj-cream text-wj-text">
      <header style={{ background: "#3D1A24", borderBottom: "1px solid #6B2D40" }}>
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 80 80" className="h-8 w-8" aria-hidden="true">
              <rect x="22" y="8" width="36" height="10" rx="3" fill="#EDD98A" />
              <rect x="16" y="20" width="48" height="52" rx="8" fill="#EDD98A" opacity="0.2" />
              <rect x="16" y="20" width="48" height="52" rx="8" fill="none" stroke="#EDD98A" strokeWidth="2" />
              <path d="M40 32L43 38.5L50 39.5L45 44.5L46.5 52L40 48.5L33.5 52L35 44.5L30 39.5L37 38.5Z" fill="#EDD98A" />
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </div>
          <nav className="flex items-center gap-2">
            <a href="/login" className="px-3 py-1.5 text-sm text-white/80 hover:text-white">Sign in</a>
            <a href="/signup" className="rounded-xl px-4 py-1.5 text-sm font-bold text-wj-plum hover:opacity-80" style={{ background: "#EDD98A" }}>
              Join free
            </a>
          </nav>
        </div>
      </header>

      <div className="border-b border-wj-card-border bg-wj-card">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-snug text-wj-text">
                Your wishes, collected.<br />Your community, connected.
              </h1>
              <p className="mb-6 text-sm leading-6 text-wj-muted">
                Build a wishlist for any goal. Share it with people who care.
              </p>
              <div className="flex items-center gap-3">
                <a href="/signup" className="rounded-2xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
                  Create your first jar
                </a>
                <a href="/login" className="rounded-2xl border border-wj-card-border px-5 py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream">
                  Sign in
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-wj-gold-card overflow-hidden" style={{ background: "#F0D080", boxShadow: "var(--wj-shadow)" }}>
              <div className="flex items-center gap-3 px-4 py-4">
                <JarIllustration variant="partial" size={70} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-wj-text">New Home Jar</span>
                    <span className="rounded-full bg-wj-cream px-2 py-0.5 text-xs text-wj-muted">New Home</span>
                  </div>
                  <div className="h-2 rounded-full bg-wj-cream">
                    <div className="h-2 w-2/5 rounded-full bg-wj-gold" />
                  </div>
                  <p className="mt-1 text-xs text-wj-muted">$1,250 planned of $3,000 goal</p>
                </div>
              </div>
              <div className="border-t border-wj-gold-card divide-y divide-wj-gold-card" style={{ background: "#FDFAF3" }}>
                {[
                  { name: "Sofa", price: "$420" },
                  { name: "Coffee machine", price: "$180" },
                  { name: "Kitchen set", price: "$650" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-wj-text">{item.name}</span>
                    <span className="text-sm font-bold text-wj-text">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-lg font-bold text-wj-text">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "1", title: "Create", desc: "Start a jar for any goal — a home, a wedding, a trip." },
            { step: "2", title: "Add wishes", desc: "Add items with prices and links. Set a target." },
            { step: "3", title: "Share", desc: "Send your jar link to friends. Let them support you." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl bg-wj-card border border-wj-card-border p-5 text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
              <div className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white bg-wj-plum">
                {item.step}
              </div>
              <h3 className="font-bold text-wj-text mb-2">{item.title}</h3>
              <p className="text-xs text-wj-muted leading-5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <h2 className="mb-5 text-base font-semibold text-wj-text">Categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {["New Home", "Wedding", "Baby", "Travel", "Education", "Birthday", "Gaming", "Startup", "Charity", "Other"].map((cat) => (
            <div key={cat} className="rounded-2xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-center text-sm text-wj-text" style={{ boxShadow: "var(--wj-shadow)" }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-wj-card-border" style={{ background: "#3D1A24" }}>
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to start?</h2>
          <p className="text-sm text-white/70 mb-6">Free. No card needed.</p>
          <a href="/signup" className="inline-block rounded-2xl px-8 py-3 text-sm font-bold text-wj-plum hover:opacity-80" style={{ background: "#EDD98A" }}>
            Get started
          </a>
        </div>
      </div>

      <footer className="border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col items-center gap-1 text-xs text-wj-muted md:flex-row md:justify-between">
            <span>© 2026 WishJar · Created by <strong className="text-wj-text">Selçuk Kıvrak</strong> · Built with AI</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-wj-text">Privacy</a>
              <a href="/terms" className="hover:text-wj-text">Terms</a>
              <a href="mailto:slckkvrk@gmail.com" className="hover:text-wj-text">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
