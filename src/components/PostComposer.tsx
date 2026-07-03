"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeText } from "@/lib/validate";

type Jar = { id: string; title: string };
type PostedPost = { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string };

type Props = {
  userId: string;
  jars: Jar[];
  onPosted: (post: PostedPost) => void;
};

export default function PostComposer({ userId, jars, onPosted }: Props) {
  const [content, setContent] = useState("");
  const [jarId, setJarId] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  if (jars.length === 0) {
    return (
      <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
        <p className="text-sm text-wj-muted mb-2">You need a jar to post yet. Create one first.</p>
        <a href="/jars/new" className="text-sm font-semibold text-wj-plum hover:underline">Create a jar →</a>
      </div>
    );
  }

  const handlePost = async () => {
    const cleaned = sanitizeText(content, 500);
    if (!cleaned || !jarId) return;
    setPosting(true);
    setError("");
    const { data: inserted, error: err } = await supabase
      .from("posts")
      .insert({ user_id: userId, content: cleaned, jar_id: jarId })
      .select("id, content, jar_id, created_at")
      .single();
    setPosting(false);
    if (err || !inserted) {
      setError(err?.message ?? "Could not post. Please try again.");
      return;
    }
    const jarTitle = jars.find((j) => j.id === jarId)?.title ?? null;
    onPosted({ ...inserted, jar_title: jarTitle });
    setContent("");
    setJarId("");
  };

  return (
    <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
      <h2 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">New Post</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2 text-sm outline-none focus:border-wj-plum text-wj-text"
      />
      <div className="flex items-center gap-2 mt-2">
        <select
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
          className="flex-1 rounded-xl border border-wj-card-border bg-wj-card px-3 py-1.5 text-xs outline-none text-wj-text"
        >
          <option value="">Which jar is this about?</option>
          {jars.map((j) => <option key={j.id} value={j.id}>🫙 {j.title}</option>)}
        </select>
        <button
          onClick={handlePost}
          disabled={posting || !content.trim() || !jarId}
          className="rounded-xl bg-wj-plum px-4 py-1.5 text-xs font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
