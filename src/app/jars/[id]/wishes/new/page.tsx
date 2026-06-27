"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
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

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          <a href="/dashboard" className="hover:underline">Home</a>
          {" / "}
          <a href={`/jars/${jarId}`} className="hover:underline">Jar</a>
          {" / Add item"}
        </p>

        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h1 className="text-sm font-bold text-gray-800">Add a wish item</h1>
            <p className="mt-0.5 text-xs text-gray-500">Add a product, goal, or item to this jar.</p>
          </div>

          <form onSubmit={handleCreateWish} className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Item name <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. PlayStation 5"
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
                  placeholder="499"
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
                placeholder="Why this item matters…"
                rows={3}
                maxLength={1000}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {errorMessage && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {loading ? "Adding…" : "Add Item"}
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
