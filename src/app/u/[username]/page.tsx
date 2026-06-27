"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
};

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
};

type Post = {
  id: string;
  content: string;
  jar_id: string | null;
  jar_title: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [postContent, setPostContent] = useState("");
  const [postJarId, setPostJarId] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setCurrentUserId(userData.user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, bio, created_at")
        .eq("username", username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }
      setProfile(profileData);

      const [{ data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase
          .from("jars")
          .select("id, title, description, category, goal_amount")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select("id, content, jar_id, created_at")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false }),
      ]);

      setJars(jarsData ?? []);

      const jarMap = Object.fromEntries((jarsData ?? []).map((j) => [j.id, j.title]));
      const mergedPosts: Post[] = (rawPosts ?? []).map((p) => ({
        ...p,
        jar_title: p.jar_id ? (jarMap[p.jar_id] ?? null) : null,
      }));
      setPosts(mergedPosts);
      setLoading(false);
    };

    load();
  }, [username]);

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    setPostError("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: inserted, error } = await supabase
      .from("posts")
      .insert({
        user_id: userData.user.id,
        content: postContent.trim(),
        jar_id: postJarId || null,
      })
      .select("id, content, jar_id, created_at")
      .single();

    setPosting(false);

    if (error) {
      setPostError(error.message);
      return;
    }

    const jarMap = Object.fromEntries(jars.map((j) => [j.id, j.title]));
    const newPost: Post = {
      ...inserted,
      jar_title: inserted.jar_id ? (jarMap[inserted.jar_id] ?? null) : null,
    };

    setPosts((prev) => [newPost, ...prev]);
    setPostContent("");
    setPostJarId("");
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-10">
        <div className="mx-auto max-w-2xl text-white">
          <a href="/dashboard" className="mb-8 inline-block text-sm text-white/50">← Home</a>
          <h1 className="text-3xl font-bold">User not found</h1>
          <p className="mt-2 text-white/50">@{username} does not exist.</p>
        </div>
      </main>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8 text-black">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
              <defs>
                <linearGradient id="jgpr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jgpr)" />
              <path d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z" fill="white" />
            </svg>
            <span className="text-2xl font-extrabold text-violet-200">WishJar</span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/feed"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              Feed
            </a>
            <a
              href="/dashboard"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
            >
              Home
            </a>
          </div>
        </header>

        {/* Profile card */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold">
                {profile.username[0].toUpperCase()}
              </div>
              <h1 className="text-3xl font-bold">@{profile.username}</h1>
              {profile.bio && (
                <p className="mt-2 max-w-lg text-white/70">{profile.bio}</p>
              )}
              <p className="mt-3 text-xs text-white/30">
                {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isOwnProfile && (
              <a
                href="/settings/profile"
                className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Edit Profile
              </a>
            )}
          </div>
        </section>

        {/* Write a post — only own profile */}
        {isOwnProfile && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Share a post</h2>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Tell your community why your jar matters..."
              rows={3}
              maxLength={500}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <select
                value={postJarId}
                onChange={(e) => setPostJarId(e.target.value)}
                className="flex-1 rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-violet-500"
              >
                <option value="">Link a jar (optional)</option>
                {jars.map((jar) => (
                  <option key={jar.id} value={jar.id}>
                    🫙 {jar.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handlePost}
                disabled={posting || !postContent.trim()}
                className="shrink-0 rounded-full bg-violet-700 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
            {postError && (
              <p className="mt-3 text-sm text-red-600">{postError}</p>
            )}
          </section>
        )}

        {/* Jars */}
        {jars.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {isOwnProfile ? "Your Jars" : "Jars"}
            </h2>
            <div className="space-y-3">
              {jars.map((jar) => (
                <a
                  key={jar.id}
                  href={`/jars/${jar.id}`}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-gray-50 p-4 hover:bg-violet-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{jar.title}</span>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {jar.category}
                      </span>
                    </div>
                    {jar.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{jar.description}</p>
                    )}
                  </div>
                  {jar.goal_amount && (
                    <span className="shrink-0 text-sm font-bold text-violet-700">
                      ${jar.goal_amount.toLocaleString()}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Posts */}
        <section>
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              <p>{isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                        {profile.username[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold">@{profile.username}</span>
                        <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-xs text-gray-300 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="mb-3 leading-7 text-gray-800">{post.content}</p>

                  {post.jar_title && post.jar_id && (
                    <a
                      href={`/jars/${post.jar_id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      <span>🫙</span>
                      {post.jar_title}
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
