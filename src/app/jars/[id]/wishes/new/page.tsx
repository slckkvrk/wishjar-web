"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

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

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push(`/jars/${jarId}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f3ff] px-6 py-8 text-black">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <a
            href={`/jars/${jarId}`}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
          >
            ← Back to Jar
          </a>

          <a
            href="/dashboard"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Home
          </a>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
            New Wish Item
          </p>

          <h1 className="mb-2 text-4xl font-extrabold">
            Add something to this jar.
          </h1>

          <p className="mb-8 text-gray-600">
            Add a product, goal, or item that belongs inside this WishJar.
          </p>

          <form onSubmit={handleCreateWish} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Wish item name
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="PlayStation 5"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Product link
              </label>
              <input
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://example.com/product"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Price
              </label>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="499"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Why this item matters..."
                rows={4}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            {errorMessage && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-violet-700 px-6 py-4 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Wish Item"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}