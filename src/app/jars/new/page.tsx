"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = [
  "Wedding",
  "New Home",
  "Baby",
  "Travel",
  "Education",
  "Startup",
  "Personal Goal",
];

export default function NewJarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUserId(data.user.id);
    };

    getUser();
  }, []);

  const handleCreateJar = async () => {
    if (!userId) {
      setMessage("You must be logged in.");
      return;
    }

    if (!title.trim()) {
      setMessage("Jar title is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("jars").insert({
      user_id: userId,
      title,
      category,
      goal_amount: goalAmount ? Number(goalAmount) : null,
      description,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-xl">
        <a href="/dashboard" className="mb-8 inline-block text-sm text-gray-500">
          ← Back to Dashboard
        </a>

        <h1 className="mb-2 text-4xl font-bold">Create New Jar</h1>

        <p className="mb-8 text-gray-600">
          Start with one clear wish. Add a goal, choose a category, and make it shareable.
        </p>

        <div className="space-y-4 rounded-xl border p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Jar Title
            </label>
            <input
              className="w-full rounded border p-3"
              placeholder="New Apartment Jar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Category
            </label>
            <select
              className="w-full rounded border p-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Goal Amount
            </label>
            <input
              type="number"
              className="w-full rounded border p-3"
              placeholder="1000"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>
            <textarea
              className="min-h-28 w-full rounded border p-3"
              placeholder="Tell people what this jar is for."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreateJar}
            disabled={saving}
            className="w-full rounded bg-violet-700 p-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Jar"}
          </button>

          {message && <p className="text-sm text-red-600">{message}</p>}
        </div>
      </div>
    </main>
  );
}