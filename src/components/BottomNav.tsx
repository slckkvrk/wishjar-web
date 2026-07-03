"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { active?: "home" | "jars" | "create" | "profile" };

export default function BottomNav({ active }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setReady(true); return; }
      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
      setUsername(profile?.username ?? null);
      setReady(true);
    };
    load();
  }, []);

  if (!ready || !username) return null;

  const navTab = (href: string, key: Props["active"], icon: React.ReactNode, label: string) => {
    const isActive = active === key;
    return (
      <a href={href} aria-label={label} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
        style={{ color: isActive ? "#3D1A24" : "#9B7E6A" }}>
        {icon}
      </a>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-wj-card border-t border-wj-card-border">
      {navTab("/", "home", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ), "Home")}

      {navTab("/jars", "jars", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="7" y="2" width="10" height="3" rx="1.5"/>
          <rect x="5" y="5" width="14" height="2" rx="1"/>
          <rect x="4" y="7" width="16" height="15" rx="4"/>
        </svg>
      ), "Jars")}

      <a href="/jars/new" className="flex flex-col items-center justify-center flex-1 py-1" aria-label="Create jar">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-3xl font-light leading-none bg-wj-plum">
          +
        </span>
      </a>

      {navTab(`/u/${username}`, "profile", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ), "Profile")}
    </nav>
  );
}
