"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { isValidUrl, sanitizeText, isValidPrice } from "@/lib/validate";

export default function NewWishPage() {
  const params = useParams();
  const router = useRouter();
  const jarId = params.id as string;

  const [title, setTitle] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      const { data: jar } = await supabase
        .from("jars").select("user_id").eq("id", jarId).single();
      if (!jar || jar.user_id !== auth.userId) {
        window.location.href = `/jars/${jarId}`;
        return;
      }
      setChecking(false);
    };
    checkOwnership();
  }, [jarId]);

  const handleCreateWish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage("You must be logged in to add a wish item.");
      setLoading(false);
      return;
    }

    if (productUrl && !isValidUrl(productUrl)) {
      setErrorMessage("Please enter a valid product URL (must start with http:// or https://).");
      setLoading(false);
      return;
    }

    if (price && !isValidPrice(price)) {
      setErrorMessage("Please enter a valid price.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("wishes").insert({
      jar_id: jarId,
      user_id: user.id,
      title: sanitizeText(title, 200),
      product_url: productUrl ? sanitizeText(productUrl, 2000) : null,
      price: price ? Number(price) : null,
      description: description ? sanitizeText(description, 1000) : null,
    });

    if (error) { setErrorMessage(error.message); setLoading(false); return; }
    router.push(`/jars/${jarId}`);
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  if (checking) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader activeTab="home" />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href={`/jars/${jarId}`} className="text-xs text-wj-muted">← Back to Jar</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Add Wish Item</h1>
        </div>

        <form onSubmit={handleCreateWish}>
          <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
            <div className="hidden md:block border-b border-wj-card-border pb-3">
              <h1 className="text-base font-bold text-wj-text">Add a wish item</h1>
              <p className="mt-0.5 text-xs text-wj-muted">Add a product, goal, or item to this jar.</p>
            </div>
            <div>
              <label className={labelCls}>Item name <span className="text-red-500">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                required placeholder="e.g. PlayStation 5" maxLength={200} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Product link <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price <span className="text-wj-muted font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wj-muted">$</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  type="number" min="0" step="0.01" placeholder="499"
                  className={`${inputCls} pl-7`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this item matters…" rows={3} maxLength={1000} className={inputCls} />
            </div>
            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
                {loading ? "Adding…" : "Add Item"}
              </button>
              <a href={`/jars/${jarId}`} className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
            </div>
          </div>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
