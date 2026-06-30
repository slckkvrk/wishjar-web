"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { activeTab?: "home" | "feed" | "profile" };

export default function SiteHeader({ activeTab }: Props) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
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
          ? "border-b-2 border-wj-gold-card font-semibold text-wj-gold-card"
          : "text-white/70 hover:text-white"
      }`}
    >
      {label}
    </a>
  );

  return (
    <header className="hidden md:block bg-wj-plum border-b border-wj-plum-mid">
      <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href={username ? "/dashboard" : "/"} className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5 shrink-0" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#EDD98A"/>
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#6B2D40"/>
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="#EDD98A"/>
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
            <a href="/settings" className="text-white/60 hover:text-white">Settings</a>
          )}
          <button onClick={handleLogout} className="text-white/60 hover:text-white">Sign out</button>
        </div>
      </div>
    </header>
  );
}
