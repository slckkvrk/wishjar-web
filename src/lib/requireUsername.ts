import { supabase } from "./supabase";

export async function requireUsername(): Promise<{ userId: string; username: string; isPremium: boolean; isVerified: boolean } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "/login"; return null; }
  const { data: profile } = await supabase
    .from("profiles").select("username, is_premium").eq("id", user.id).single();
  if (!profile?.username) { window.location.href = "/setup/username"; return null; }
  const { data: verification } = await supabase
    .from("profiles").select("is_verified").eq("id", user.id).single();
  return { userId: user.id, username: profile.username, isPremium: profile.is_premium ?? false, isVerified: verification?.is_verified ?? false };
}
