"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
  created_at: string;
  user_id: string;
  status: string;
};

type Wish = {
  id: string;
  title: string;
  description: string | null;
  product_url: string | null;
  price: number | null;
  created_at: string;
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

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }

      const { data, error } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, created_at, user_id, status")
        .eq("id", jarId)
        .single();

      if (error || !data) { setMessage("Jar not found."); setLoading(false); return; }

      setJar(data);
      setIsOwner(data.user_id === userData.user.id);

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user_id).single();
      setOwnerUsername(profile?.username ?? null);

      const { data: wishesData, error: wishesError } = await supabase
        .from("wishes")
        .select("id, title, description, product_url, price, created_at")
        .eq("jar_id", jarId)
        .order("created_at", { ascending: false });

      if (wishesError) { setMessage(wishesError.message); setLoading(false); return; }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">Loading jar…</div>
      </div>
    );
  }

  if (!jar) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm text-red-600">{message || "Jar not found."}</p>
          <a href="/dashboard" className="mt-3 inline-block text-sm text-violet-700 hover:underline">← Back to Home</a>
        </div>
      </div>
    );
  }

  const totalWishValue = wishes.reduce((s, w) => s + (w.price ?? 0), 0);
  const progressPct = jar.goal_amount && jar.goal_amount > 0
    ? Math.min((totalWishValue / jar.goal_amount) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Breadcrumb */}
        <p className="mb-4 text-xs text-gray-400">
          <a href="/dashboard" className="hover:underline">Home</a>
          {" / "}
          <span>{jar.title}</span>
        </p>

        <div className="grid gap-5 md:grid-cols-[1fr_260px]">

          {/* Left: jar info + wish list */}
          <div className="space-y-4">

            {/* Jar header */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-gray-900">{jar.title}</h1>
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">{jar.category}</span>
                    {jar.status === "completed" && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">Completed</span>
                    )}
                  </div>
                  {ownerUsername && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      by{" "}
                      <a href={`/u/${ownerUsername}`} className="text-violet-700 hover:underline">
                        @{ownerUsername}
                      </a>
                    </p>
                  )}
                </div>
                {isOwner && (
                  <a
                    href={`/jars/${jar.id}/edit`}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit jar
                  </a>
                )}
              </div>
              {jar.description && (
                <div className="px-4 py-3">
                  <p className="text-sm leading-6 text-gray-600">{jar.description}</p>
                </div>
              )}
            </div>

            {/* Wish list */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h2 className="text-sm font-bold text-gray-800">
                  Wish Items
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({wishes.length})
                  </span>
                </h2>
                {isOwner && (
                  <a
                    href={`/jars/${jar.id}/wishes/new`}
                    className="rounded bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800"
                  >
                    + Add item
                  </a>
                )}
              </div>

              {wishes.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">No wish items yet.</p>
                  {isOwner && (
                    <a href={`/jars/${jar.id}/wishes/new`} className="mt-2 inline-block text-sm text-violet-700 hover:underline">
                      Add your first item
                    </a>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {wishes.map((wish) => (
                    <li key={wish.id} className="flex items-start justify-between px-4 py-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-semibold text-gray-800">{wish.title}</p>
                        {wish.description && (
                          <p className="mt-0.5 text-xs text-gray-500">{wish.description}</p>
                        )}
                        {wish.product_url && (
                          <a
                            href={wish.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-block text-xs text-violet-700 hover:underline"
                          >
                            View product →
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {wish.price !== null && (
                          <span className="text-sm font-bold text-gray-800">
                            ${wish.price.toLocaleString()}
                          </span>
                        )}
                        {isOwner && (
                          <div className="flex gap-1.5">
                            <a
                              href={`/jars/${jar.id}/wishes/${wish.id}/edit`}
                              className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Edit
                            </a>
                            <button
                              onClick={() => handleDeleteWish(wish.id)}
                              disabled={deletingId === wish.id}
                              className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === wish.id ? "…" : "Remove"}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {message && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <p className="text-xs text-red-600">{message}</p>
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Progress */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Progress</span>
              </div>
              <div className="px-4 py-4">
                <div className="mb-3 flex items-end justify-between text-xs text-gray-500">
                  <div>
                    <p className="text-xs text-gray-400">Total wish value</p>
                    <p className="text-xl font-bold text-gray-900">${totalWishValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Goal</p>
                    <p className="text-xl font-bold text-violet-700">
                      {jar.goal_amount ? `$${jar.goal_amount.toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-violet-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {jar.goal_amount && (
                  <p className="mt-1.5 text-right text-xs text-gray-400">
                    {Math.round(progressPct)}% of goal
                  </p>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Share this jar</span>
              </div>
              <div className="px-4 py-4">
                <p className="mb-3 text-xs leading-5 text-gray-500">
                  Share this link with friends, family, or your community.
                </p>
                <div className="mb-3 overflow-hidden rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 break-all">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full rounded border border-violet-300 bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
