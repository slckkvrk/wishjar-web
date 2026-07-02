"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import NotificationRow, { NotificationItem } from "@/components/NotificationRow";

type RawNotification = {
  id: string;
  type: "follow" | "new_post" | "jar_milestone" | "jar_completed";
  actor_id: string | null;
  jar_id: string | null;
  percent: number | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;

      const { data: rawNotifications, error: fetchError } = await supabase
        .from("notifications")
        .select("id, type, actor_id, jar_id, percent, read_at, created_at")
        .eq("recipient_id", auth.userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        setError("Could not load notifications. Please try again.");
        setLoading(false);
        return;
      }

      const rows = (rawNotifications ?? []) as RawNotification[];
      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))];
      const jarIds = [...new Set(rows.map((r) => r.jar_id).filter((id): id is string => !!id))];

      const [{ data: actors }, { data: jars }] = await Promise.all([
        actorIds.length > 0
          ? supabase.from("profiles").select("id, username").in("id", actorIds)
          : Promise.resolve({ data: [] as { id: string; username: string }[] }),
        jarIds.length > 0
          ? supabase.from("jars").select("id, title").in("id", jarIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);

      const actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a.username]));
      const jarMap = Object.fromEntries((jars ?? []).map((j) => [j.id, j.title]));

      setNotifications(rows.map((r) => ({
        id: r.id,
        type: r.type,
        actorUsername: r.actor_id ? (actorMap[r.actor_id] ?? null) : null,
        jarId: r.jar_id,
        jarTitle: r.jar_id ? (jarMap[r.jar_id] ?? null) : null,
        percent: r.percent,
        createdAt: r.created_at,
      })));
      setLoading(false);

      const unreadIds = rows.filter((r) => !r.read_at).map((r) => r.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a href="/dashboard" className="text-wj-plum hover:underline">← Home</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Notifications</h1>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 mb-4">{error}</p>
        )}

        {!error && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted">No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
