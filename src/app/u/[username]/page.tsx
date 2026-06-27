"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import { sanitizeText } from "@/lib/validate";

type Profile = { id: string; username: string; bio: string | null; created_at: string; };
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
  const [activeTab, setActiveTab] = useState<"posts" | "jars">("posts");

  const [postContent, setPostContent] = useState("");
  const [postJarId, setPostJarId] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      setCurrentUserId(userData.user.id);

      const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at").eq("username", username).single();
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

  const handlePost = async () => {
    const content = sanitizeText(postContent, 500);
    if (!content) return;
    setPosting(true);
    setPostError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: inserted, error } = await supabase.from("posts").insert({ user_id: userData.user.id, content, jar_id: postJarId || null }).select("id, content, jar_id, created_at").single();
    setPosting(false);
    if (error) { setPostError(error.message); return; }
    const jarMap = Object.fromEntries(jars.map((j) => [j.id, j.title]));
    setPosts((prev) => [{ ...inserted, jar_title: inserted.jar_id ? (jarMap[inserted.jar_id] ?? null) : null }, ...prev]);
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
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm text-gray-600">User <strong>@{username}</strong> not found.</p>
          <a href="/dashboard" className="mt-2 inline-block text-sm text-violet-700 hover:underline">← Home</a>
        </div>
      </div>
    );
  }

  const isOwn = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="profile" />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          <a href="/feed" className="hover:underline">Feed</a>
          {" / "}@{profile.username}
        </p>

        <div className="grid gap-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">

            {/* Profile card */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-violet-600 text-lg font-bold text-white">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-900">@{profile.username}</h1>
                    {profile.bio && <p className="mt-0.5 text-sm text-gray-500">{profile.bio}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {isOwn && (
                  <a href="/settings/profile" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    Edit profile
                  </a>
                )}
              </div>
            </div>

            {/* Write post */}
            {isOwn && (
              <div className="rounded border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">New Post</span>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Tell your community why your jar matters…"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={postJarId}
                      onChange={(e) => setPostJarId(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-violet-500"
                    >
                      <option value="">Link a jar (optional)</option>
                      {jars.map((j) => <option key={j.id} value={j.id}>🫙 {j.title}</option>)}
                    </select>
                    <button
                      onClick={handlePost}
                      disabled={posting || !postContent.trim()}
                      className="rounded bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                    >
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                  {postError && <p className="text-xs text-red-600">{postError}</p>}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="flex border-b border-gray-200">
                {(["posts", "jars"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-violet-700 text-violet-700"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab} ({tab === "posts" ? posts.length : jars.length})
                  </button>
                ))}
              </div>

              {/* Posts tab */}
              {activeTab === "posts" && (
                posts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    {isOwn ? "You haven't posted yet." : "No posts yet."}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {posts.map((post) => (
                      <li key={post.id} className="px-4 py-4">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                          {isOwn && (
                            <button onClick={() => handleDeletePost(post.id)} className="text-xs text-gray-300 hover:text-red-500">
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm leading-6 text-gray-800">{post.content}</p>
                        {post.jar_title && post.jar_id && (
                          <div className="mt-2">
                            <a href={`/jars/${post.jar_id}`} className="inline-block rounded border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100">
                              🫙 {post.jar_title}
                            </a>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* Jars tab */}
              {activeTab === "jars" && (
                jars.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    {isOwn ? <><p>No jars yet.</p><a href="/jars/new" className="mt-2 inline-block text-violet-700 hover:underline">Create your first jar</a></> : "No jars yet."}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {jars.map((jar) => (
                      <li key={jar.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <a href={`/jars/${jar.id}`} className="text-sm font-semibold text-violet-700 hover:underline">{jar.title}</a>
                            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-700">{jar.category}</span>
                          </div>
                          {jar.description && <p className="mt-0.5 truncate text-xs text-gray-500">{jar.description}</p>}
                        </div>
                        {jar.goal_amount && <span className="shrink-0 text-xs font-semibold text-gray-600">${jar.goal_amount.toLocaleString()}</span>}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div>
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">About</span>
              </div>
              <div className="px-4 py-3 text-xs text-gray-500 space-y-1.5">
                <p><span className="text-gray-400">Username: </span><strong className="text-gray-700">@{profile.username}</strong></p>
                <p><span className="text-gray-400">Joined: </span>{new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                {isOwn && <p className="pt-1"><a href="/settings/profile" className="text-violet-700 hover:underline">Edit profile settings</a></p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
