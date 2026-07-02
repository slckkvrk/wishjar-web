import AvatarCircle from "./AvatarCircle";
import { timeAgo } from "@/lib/time";

type Props = {
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
  content: string;
  jarId: string | null;
  jarTitle: string | null;
  showAuthor?: boolean;
  onDelete?: () => void;
};

export default function PostCard({
  username, avatarUrl, createdAt, content, jarId, jarTitle, showAuthor = true, onDelete,
}: Props) {
  return (
    <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
      <div className="flex items-center justify-between mb-2">
        {showAuthor ? (
          <div className="flex items-center gap-2">
            <AvatarCircle name={username} avatarUrl={avatarUrl} size="sm" />
            <a href={`/u/${username}`} className="text-sm font-semibold text-wj-plum hover:underline">
              @{username}
            </a>
            <span className="text-xs text-wj-muted">{timeAgo(createdAt)}</span>
          </div>
        ) : (
          <span className="text-xs text-wj-muted">{timeAgo(createdAt)}</span>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-xs text-wj-muted hover:text-red-500">
            Delete
          </button>
        )}
      </div>
      <p className="text-sm leading-6 text-wj-text">{content}</p>
      {jarTitle && jarId && (
        <div className="mt-2">
          <a
            href={`/jars/${jarId}`}
            className="inline-block rounded-xl border border-wj-gold-card bg-wj-gold-light px-2.5 py-1 text-xs font-semibold text-wj-text hover:opacity-80"
          >
            🫙 {jarTitle}
          </a>
        </div>
      )}
    </div>
  );
}
