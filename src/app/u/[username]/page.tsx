"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
};

type Jar = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_amount: number | null;
  created_at: string;
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      setCurrentUserId(userData.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, bio, created_at")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: jarsData } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, created_at")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      setJars(jarsData ?? []);
      setLoading(false);
    };

    load();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-10">
        <div className="mx-auto max-w-2xl text-white">
          <a href="/dashboard" className="mb-8 inline-block text-sm text-white/50">← Home</a>
          <h1 className="text-3xl font-bold">User not found</h1>
          <p className="mt-2 text-white/50">@{username} does not exist.</p>
        </div>
      </main>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white px-6 py-8 text-black">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
              <defs>
                <linearGradient id="jgp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jgp)" />
              <path d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z" fill="white" />
            </svg>
            <span className="text-2xl font-extrabold text-violet-200">WishJar</span>
          </a>

          <a
            href="/dashboard"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            ← Home
          </a>
        </header>

        {/* Profile card */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold text-white">
                {profile.username[0].toUpperCase()}
              </div>
              <h1 className="text-3xl font-bold">@{profile.username}</h1>
              {profile.bio && (
                <p className="mt-2 max-w-lg text-white/70">{profile.bio}</p>
              )}
              <p className="mt-3 text-xs text-white/30">
                {jars.length} jar{jars.length !== 1 ? "s" : ""}
              </p>
            </div>

            {isOwnProfile && (
              <a
                href="/settings/profile"
                className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Edit Profile
              </a>
            )}
          </div>
        </section>

        {/* Jars */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-5 text-xl font-bold">
            {isOwnProfile ? "Your Jars" : `${profile.username}'s Jars`}
          </h2>

          {jars.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-gray-400">
              <p>No jars yet.</p>
              {isOwnProfile && (
                <a
                  href="/jars/new"
                  className="mt-4 inline-block rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
                >
                  Create a Jar
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {jars.map((jar) => (
                <a
                  key={jar.id}
                  href={`/jars/${jar.id}`}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-gray-50 p-5 hover:bg-violet-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{jar.title}</h3>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {jar.category}
                      </span>
                    </div>
                    {jar.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-1">{jar.description}</p>
                    )}
                  </div>
                  {jar.goal_amount && (
                    <span className="shrink-0 text-sm font-bold text-violet-700">
                      ${jar.goal_amount.toLocaleString()}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
