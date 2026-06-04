"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(data.user.email ?? null);
      setLoading(false);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="min-h-screen p-10">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome to WishJar</h1>

        <p className="mb-8 text-gray-600">
          Your account is active: {email}
        </p>

        <div className="border rounded p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">Your Jars</h2>
          <p className="text-gray-600 mb-4">
            You do not have any jars yet.
          </p>

          <button className="bg-black text-white px-5 py-3 rounded">
            Create New Jar
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="border px-5 py-3 rounded"
        >
          Logout
        </button>
      </div>
    </main>
  );
}