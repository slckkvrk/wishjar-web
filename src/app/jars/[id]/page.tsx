"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import JarIllustration from "@/components/JarIllustration";
import ProgressBar from "@/components/ProgressBar";
import FollowButton from "@/components/FollowButton";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null; category: string;
  goal_amount: number | null; created_at: string; user_id: string; status: string;
  follower_count: number;
};
type Wish = {
  id: string; title: string; description: string | null;
  product_url: string | null; price: number | null; created_at: string;
};

export default function JarDetailPage() {
  const params = useParams();
  const jarId = params.id as string;
  const [jar, setJar] = useState<Jar | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      const { data, error } = await supabase
        .from("jars").select("id, title, description, category, goal_amount, created_at, user_id, status, follower_count")
        .eq("id", jarId).single();
      if (error || !data) {
        setMessage(error ? `Jar not found. (${error.code}: ${error.message})` : "Jar not found.");
        setLoading(false);
        return;
      }
      setJar(data);
      setIsOwner(data.user_id === auth.userId);
      setCurrentUserId(auth.userId);
      setFollowerCount(data.follower_count);
      if (data.user_id !== auth.userId) {
        const { data: followRow } = await supabase
          .from("jar_follows").select("user_id")
          .eq("user_id", auth.userId).eq("jar_id", jarId).maybeSingle();
        setFollowing(!!followRow);
      }
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user_id).single();
      setOwnerUsername(profile?.username ?? null);
      const { data: wishesData } = await supabase
        .from("wishes").select("id, title, description, product_url, price, created_at")
        .eq("jar_id", jarId).order("created_at", { ascending: false });
      setWishes(wishesData ?? []);
      setLoading(false);
    };
    load();
  }, [jarId]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteWish = async (wishId: string) => {
    if (!confirm("Remove this wish item?")) return;
    setDeletingId(wishId);
    const { error } = await supabase.from("wishes").delete().eq("id", wishId);
    if (error) { setMessage(error.message); setDeletingId(null); return; }
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
    setDeletingId(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading jar…</div>
    </div>
  );

  if (!jar) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-red-600">{message || "Jar not found."}</p>
        <a href="/dashboard" className="mt-3 inline-block text-sm text-wj-plum hover:underline">← Back to Home</a>
      </div>
    </div>
  );

  const totalWishValue = wishes.reduce((s, w) => s + (w.price ?? 0), 0);
  const progressPct = jar.goal_amount && jar.goal_amount > 0
    ? Math.min(Math.round((totalWishValue / jar.goal_amount) * 100), 100) : 0;
  const illustrationVariant = jar.status === "completed" ? "full" : wishes.length > 0 ? "partial" : "empty";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      {/* Mobile hero */}
      <div
        className="md:hidden"
        style={{ background: jar.status === "completed" ? "#F0D080" : "#FDFAF3", borderBottom: "1px solid #E8DCBB" }}
      >
        <div className="px-4 pt-5 pb-4 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <a href="/jars" className="text-xs text-wj-muted mb-2 inline-block">← My Jars</a>
            <h1 className="text-2xl font-bold text-wj-text mb-1">{jar.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
            {ownerUsername && (
              <p className="mt-1 text-xs text-wj-muted">
                by <a href={`/u/${ownerUsername}`} className="text-wj-plum hover:underline">@{ownerUsername}</a>
              </p>
            )}
            {jar.goal_amount && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-wj-muted">${totalWishValue.toLocaleString()} / ${jar.goal_amount.toLocaleString()}</span>
                  <span className="font-semibold text-wj-text">{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} />
              </div>
            )}
            {!isOwner && currentUserId && (
              <div className="mt-3 flex items-center gap-2">
                <FollowButton
                  jarId={jar.id}
                  userId={currentUserId}
                  following={following}
                  onToggle={(next) => {
                    setFollowing(next);
                    setFollowerCount((c) => c + (next ? 1 : -1));
                  }}
                />
                <span className="text-xs text-wj-muted whitespace-nowrap">
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </span>
              </div>
            )}
          </div>
          <JarIllustration variant={illustrationVariant} size={90} />
        </div>
        {isOwner && (
          <div className="px-4 pb-4 flex gap-2">
            <a href={`/jars/${jar.id}/wishes/new`}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-white bg-wj-plum">
              + Add Wish
            </a>
            <a href={`/jars/${jar.id}/edit`}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
              Edit Jar
            </a>
            <button onClick={handleCopyLink}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        )}
      </div>

      <div className="md:mx-auto md:max-w-5xl md:px-4 md:py-6 md:grid md:gap-5 md:grid-cols-[1fr_260px]">
        {/* Wish list */}
        <div className="px-4 pt-4 md:px-0 md:pt-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-wj-text">
              Wish Items
              <span className="ml-2 text-sm font-normal text-wj-muted">({wishes.length})</span>
            </h2>
            {isOwner && (
              <a href={`/jars/${jar.id}/wishes/new`}
                className="hidden md:inline-block px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">
                + Add item
              </a>
            )}
          </div>

          {wishes.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-wj-card border border-wj-card-border">
              <p className="text-sm text-wj-muted">No wish items yet.</p>
              {isOwner && (
                <a href={`/jars/${jar.id}/wishes/new`} className="mt-2 inline-block text-sm text-wj-plum hover:underline">
                  Add your first item
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {wishes.map((wish) => (
                <div key={wish.id} className="rounded-2xl p-4 bg-wj-card border border-wj-card-border flex items-start justify-between" style={{ boxShadow: "var(--wj-shadow)" }}>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-wj-text">{wish.title}</p>
                    {wish.description && <p className="mt-0.5 text-xs text-wj-muted">{wish.description}</p>}
                    {wish.product_url && (
                      <a href={wish.product_url} target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-xs text-wj-plum hover:underline">
                        View product →
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {wish.price !== null && (
                      <span className="text-sm font-bold text-wj-text">${wish.price.toLocaleString()}</span>
                    )}
                    {isOwner && (
                      <div className="flex gap-1.5">
                        <a href={`/jars/${jar.id}/wishes/${wish.id}/edit`}
                          className="rounded-lg border border-wj-card-border px-2 py-0.5 text-xs text-wj-text hover:bg-wj-cream">
                          Edit
                        </a>
                        <button onClick={() => handleDeleteWish(wish.id)} disabled={deletingId === wish.id}
                          className="rounded-lg border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                          {deletingId === wish.id ? "…" : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && <p className="mt-3 text-xs text-red-600">{message}</p>}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block space-y-4">
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <div className="flex justify-center mb-3">
              <JarIllustration variant={illustrationVariant} size={100} />
            </div>
            <h1 className="text-base font-bold text-wj-text mb-1">{jar.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
            {jar.description && <p className="mt-2 text-xs text-wj-muted leading-5">{jar.description}</p>}
            {jar.goal_amount && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-wj-muted">${totalWishValue.toLocaleString()} / ${jar.goal_amount.toLocaleString()}</span>
                  <span className="font-semibold text-wj-text">{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} />
              </div>
            )}
            {!isOwner && currentUserId && (
              <div className="mt-3 flex items-center gap-2">
                <FollowButton
                  jarId={jar.id}
                  userId={currentUserId}
                  following={following}
                  onToggle={(next) => {
                    setFollowing(next);
                    setFollowerCount((c) => c + (next ? 1 : -1));
                  }}
                />
                <span className="text-xs text-wj-muted whitespace-nowrap">
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </span>
              </div>
            )}
            {isOwner && (
              <div className="mt-3 space-y-2">
                <a href={`/jars/${jar.id}/wishes/new`}
                  className="block w-full py-2.5 text-sm font-bold text-center rounded-xl text-white bg-wj-plum">
                  + Add Wish Item
                </a>
                <a href={`/jars/${jar.id}/edit`}
                  className="block w-full py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
                  Edit Jar
                </a>
              </div>
            )}
          </div>
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h3 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">Share this jar</h3>
            <div className="mb-3 rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2 text-xs text-wj-muted break-all">
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>
            <button onClick={handleCopyLink}
              className="w-full py-2 rounded-xl text-xs font-bold text-wj-plum border border-wj-plum hover:bg-wj-cream">
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
