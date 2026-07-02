"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import AvatarCircle from "@/components/AvatarCircle";
import BottomNav from "@/components/BottomNav";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";

type Profile = { id: string; username: string; bio: string | null; created_at: string; is_premium: boolean; avatar_url: string | null; };
type Jar = { id: string; title: string; description: string | null; category: string; goal_amount: number | null; };
type Post = { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string; };

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "jars">("posts");

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      setCurrentUserId(userData.user.id);

      const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at, is_premium, avatar_url").eq("username", username).single();
      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);

      const [{ data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase.from("jars").select("id, title, description, category, goal_amount").eq("user_id", profileData.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, content, jar_id, created_at").eq("user_id", profileData.id).order("created_at", { ascending: false }),
      ]);

      setJars(jarsData ?? []);
      const jarMap = Object.fromEntries((jarsData ?? []).map((j) => [j.id, j.title]));
      setPosts((rawPosts ?? []).map((p) => ({ ...p, jar_title: p.jar_id ? (jarMap[p.jar_id] ?? null) : null })));
      setLoading(false);
    };
    load();
  }, [username]);

  const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-wj-text">User <strong>@{username}</strong> not found.</p>
        <a href="/dashboard" className="mt-2 inline-block text-sm text-wj-plum hover:underline">← Home</a>
      </div>
    </div>
  );

  const isOwn = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="profile" />

      {/* Mobile profile hero */}
      <div className="md:hidden" style={{ background: "#FDFAF3", borderBottom: "1px solid #E8DCBB" }}>
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatar_url} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-wj-text">
                @{profile.username}
                {profile.is_premium && <span title="Premium account" className="ml-1.5 text-wj-gold">★</span>}
              </h1>
              {profile.bio && <p className="text-xs text-wj-muted mt-0.5">{profile.bio}</p>}
              <p className="text-xs text-wj-muted mt-1">
                {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isOwn && (
              <div className="flex items-center gap-2 shrink-0">
                <a href="/settings/profile"
                  className="rounded-xl border border-wj-card-border px-3 py-1.5 text-xs font-semibold text-wj-text hover:bg-wj-cream">
                  Edit
                </a>
                <button onClick={handleSignOut} disabled={signingOut}
                  className="rounded-xl border border-wj-card-border px-3 py-1.5 text-xs font-semibold text-wj-muted hover:bg-wj-cream disabled:opacity-50">
                  {signingOut ? "…" : "Sign out"}
                </button>
              </div>
            )}
          </div>

          {/* Tab pills */}
          <div className="flex items-center rounded-2xl p-1 gap-1 bg-wj-cream border border-wj-card-border">
            {(["posts", "jars"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
                style={{
                  backgroundColor: tab === t ? "#3D1A24" : "transparent",
                  color: tab === t ? "white" : "#9B7E6A",
                }}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "posts" ? posts.length : jars.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="md:mx-auto md:max-w-5xl md:px-4 md:py-6 md:grid md:gap-5 md:grid-cols-[1fr_260px]">
        <div className="space-y-3 px-4 pt-4 md:px-0 md:pt-0">

          {/* Desktop profile card */}
          <div className="hidden md:block rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatar_url} />
                <div>
                  <h1 className="text-base font-bold text-wj-text">
                    @{profile.username}
                    {profile.is_premium && <span title="Premium account" className="ml-1.5 text-wj-gold">★</span>}
                  </h1>
                  {profile.bio && <p className="mt-0.5 text-sm text-wj-muted">{profile.bio}</p>}
                  <p className="mt-1 text-xs text-wj-muted">
                    {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {isOwn && (
                <a href="/settings/profile"
                  className="rounded-xl border border-wj-card-border px-3 py-1.5 text-xs font-semibold text-wj-text hover:bg-wj-cream">
                  Edit profile
                </a>
              )}
            </div>
          </div>

          {/* Desktop tab pills */}
          <div className="hidden md:flex items-center rounded-2xl p-1 gap-1 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            {(["posts", "jars"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
                style={{
                  backgroundColor: tab === t ? "#3D1A24" : "transparent",
                  color: tab === t ? "white" : "#9B7E6A",
                }}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "posts" ? posts.length : jars.length})
              </button>
            ))}
          </div>

          {/* Post composer */}
          {isOwn && currentUserId && (
            <PostComposer userId={currentUserId} jars={jars} onPosted={handlePosted} />
          )}

          {/* Posts tab */}
          {tab === "posts" && (
            posts.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-wj-card border border-wj-card-border">
                <p className="text-sm text-wj-muted">{isOwn ? "You haven't posted yet." : "No posts yet."}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    username={profile.username}
                    createdAt={post.created_at}
                    content={post.content}
                    jarId={post.jar_id}
                    jarTitle={post.jar_title}
                    showAuthor={false}
                    onDelete={isOwn ? () => handleDeletePost(post.id) : undefined}
                  />
                ))}
              </div>
            )
          )}

          {/* Jars tab */}
          {tab === "jars" && (
            jars.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-wj-card border border-wj-card-border">
                <p className="text-sm text-wj-muted">{isOwn ? "No jars yet." : "No jars yet."}</p>
                {isOwn && <a href="/jars/new" className="mt-2 inline-block text-sm text-wj-plum hover:underline">Create your first jar</a>}
              </div>
            ) : (
              <div className="space-y-2">
                {jars.map((jar) => (
                  <a key={jar.id} href={`/jars/${jar.id}`}
                    className="block rounded-2xl p-4 bg-wj-card border border-wj-card-border hover:opacity-80" style={{ boxShadow: "var(--wj-shadow)" }}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-wj-plum">{jar.title}</span>
                          <span className="rounded-full bg-wj-cream px-2 py-0.5 text-xs text-wj-muted">{jar.category}</span>
                        </div>
                        {jar.description && <p className="text-xs text-wj-muted line-clamp-1">{jar.description}</p>}
                      </div>
                      {jar.goal_amount && <span className="shrink-0 text-xs font-semibold text-wj-text">${jar.goal_amount.toLocaleString()}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block space-y-4">
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h3 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">About</h3>
            <div className="text-xs text-wj-muted space-y-1.5">
              <p><span className="text-wj-text font-semibold">@{profile.username}</span></p>
              <p>Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
              {isOwn && (
                <>
                  <p className="pt-1"><a href="/settings/profile" className="text-wj-plum hover:underline">Edit profile settings</a></p>
                  <p>
                    <button onClick={handleSignOut} disabled={signingOut} className="text-wj-muted hover:text-wj-text disabled:opacity-50">
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
