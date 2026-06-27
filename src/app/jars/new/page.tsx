"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import { sanitizeText } from "@/lib/validate";

const categories = ["New Home","Wedding","Baby","Birthday","Travel","Education","Gaming","Startup","Charity","Other"];

export default function NewJarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
      setUserId(data.user.id);
    });
  }, []);

  const handleCreate = async () => {
    if (!userId) { setMessage("You must be logged in."); return; }
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("jars").insert({
      user_id: userId,
      title: sanitizeText(title, 200),
      category,
      goal_amount: goalAmount ? Number(goalAmount) : null,
      description: sanitizeText(description, 1000) || null,
    });
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#f0eeea]">
      <SiteHeader activeTab="home" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">
          <a href="/dashboard" className="hover:underline">Home</a> / New Jar
        </p>

        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h1 className="text-sm font-bold text-gray-800">Create a new jar</h1>
            <p className="mt-0.5 text-xs text-gray-500">Give your jar a name and set a goal.</p>
          </div>

          <div className="px-4 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Jar name <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Apartment"
                maxLength={200}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Goal amount <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="1000"
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
                placeholder="Tell people what this jar is for."
                rows={4}
                maxLength={1000}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create Jar"}
              </button>
              <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
