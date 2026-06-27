"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("wishes")
        .select("id, title, description, product_url, price")
        .eq("id", wishId)
        .single();

      if (error || !data) {
        setMessage("Wish item not found.");
        setLoading(false);
        return;
      }

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

    if (!title.trim()) {
      setMessage("Item name is required.");
      return;
    }

    if (productUrl && !isValidUrl(productUrl)) {
      setMessage("Please enter a valid product URL.");
      return;
    }

    if (price && !isValidPrice(price)) {
      setMessage("Please enter a valid price.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("wishes")
      .update({
        title: sanitizeText(title, 200),
        product_url: productUrl ? sanitizeText(productUrl, 2000) : null,
        price: price ? Number(price) : null,
        description: description ? sanitizeText(description, 1000) : null,
      })
      .eq("id", wishId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/jars/${jarId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading...</p>
      </main>
    );
  }

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
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
            Edit Wish Item
          </p>
          <h1 className="mb-8 text-3xl font-extrabold">Update this item</h1>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Item name <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Product link{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Price{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-black/10 pl-8 pr-4 py-3 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-violet-700 py-4 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

      </div>
    </main>
  );
}
