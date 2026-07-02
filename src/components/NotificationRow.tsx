import { timeAgo } from "@/lib/time";

export type NotificationItem = {
  id: string;
  type: "follow" | "new_post" | "jar_milestone" | "jar_completed";
  actorUsername: string | null;
  jarId: string | null;
  jarTitle: string | null;
  percent: number | null;
  createdAt: string;
};

function messageFor(n: NotificationItem): string {
  const jar = n.jarTitle ?? "a jar";
  const actor = n.actorUsername ?? "Someone";
  if (n.type === "follow") return `${actor} started following your jar "${jar}".`;
  if (n.type === "new_post") return `${actor} posted an update on "${jar}".`;
  if (n.type === "jar_milestone") return `"${jar}" reached ${n.percent}% of its goal.`;
  return `"${jar}" is complete!`;
}

type Props = { notification: NotificationItem };

export default function NotificationRow({ notification }: Props) {
  const body = (
    <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
      <p className="text-sm text-wj-text leading-relaxed">{messageFor(notification)}</p>
      <span className="mt-1 block text-xs text-wj-muted">{timeAgo(notification.createdAt)}</span>
    </div>
  );

  if (!notification.jarId) return body;

  return (
    <a href={`/jars/${notification.jarId}`} className="block">
      {body}
    </a>
  );
}
