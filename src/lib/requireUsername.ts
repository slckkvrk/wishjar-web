import { supabase } from "./supabase";

export async function requireUsername(): Promise<{ userId: string; username: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "/login"; return null; }
  const { data: profile } = await supabase
    .from("profiles").select("username").eq("id", user.id).single();
  if (!profile?.username) { window.location.href = "/setup/username"; return null; }
  return { userId: user.id, username: profile.username };
}
