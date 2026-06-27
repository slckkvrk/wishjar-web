"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import { isValidUrl, sanitizeText, isValidPrice } from "@/lib/validate";

export default function EditWishPage() {
  const params = useParams();
  const router = useRouter();
  const jarId = params.id as string;
  const wishId = params.wishId as string;

  const [title, setTitle] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadWish = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }

      const { data, error } = await supabase
        .from("wishes")
        .select("id, title, description, product_url, price")
        .eq("id", wishId)
        .single();

      if (error || !data) { setMessage("Wish item not found."); setLoading(false); return; }

      setTitle(data.title);
      setProductUrl(data.product_url ?? "");
      setPrice(data.price !== null ? String(data.price) : "");
      setDescription(data.description ?? "");
      setLoading(false);
    };
    loadWish();
  }, [wishId]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) { setMessage("Item name is required."); return; }
    if (productUrl && !isValidUrl(productUrl)) { setMessage("Please enter a valid product URL."); return; }
    if (price && !isValidPrice(price)) { setMessage("Please enter a valid price."); return; }

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("wishes").update({
      title: sanitizeText(title, 200),
      product_url: productUrl ? sanitizeText(productUrl, 2000) : null,
      price: price ? Number(price) : null,
      description: description ? sanitizeText(description, 1000) : null,
    }).eq("id", wishId);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    router.push(`/jars/${jarId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0eeea]">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-8 text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          <a href="/dashboard" className="hover:underline">Home</a>
          {" / "}
          <a href={`/jars/${jarId}`} className="hover:underline">Jar</a>
          {" / Edit item"}
        </p>

        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h1 className="text-sm font-bold text-gray-800">Edit wish item</h1>
          </div>

          <form onSubmit={handleSave} className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Item name <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Product link <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Price <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-gray-300 pl-7 pr-3 py-2 text-sm outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <a href={`/jars/${jarId}`} className="text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
