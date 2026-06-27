"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  activeTab?: "home" | "feed" | "profile";
};

export default function SiteHeader({ activeTab }: Props) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .single();
      setUsername(profile?.username ?? null);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const link = (href: string, label: string, tab?: Props["activeTab"]) => (
    <a
      href={href}
      className={`px-3 py-2 text-sm transition-colors ${
        activeTab === tab
          ? "border-b-2 border-white font-semibold text-white"
          : "text-white/70 hover:text-white"
      }`}
    >
      {label}
    </a>
  );

  return (
    <header className="border-b border-[#1e0d5c] bg-[#2c1875]">
      <div className="mx-auto flex h-10 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5 shrink-0" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#a78bfa" />
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#7c3aed" />
              <path
                d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z"
                fill="white"
              />
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </a>

          <nav className="flex items-center">
            {link("/dashboard", "Home", "home")}
            {link("/feed", "Feed", "feed")}
            {username && link(`/u/${username}`, `@${username}`, "profile")}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {username && (
            <a
              href="/settings/profile"
              className="text-white/60 hover:text-white"
            >
              Settings
            </a>
          )}
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
