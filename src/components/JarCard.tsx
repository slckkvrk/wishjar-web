import { useState } from "react";
import AvatarCircle from "./AvatarCircle";
import ProgressBar from "./ProgressBar";
import JarIllustration from "./JarIllustration";
import FollowButton from "./FollowButton";
import { completedLabel } from "@/lib/time";

type JarCardProps = {
  jar: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    goal_amount: number | null;
    status: string;
    username: string;
    isVerified?: boolean;
    completed_at?: string | null;
  };
  totalWishValue?: number;
  isOwn?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
  currentUserId?: string;
};

export default function JarCard({ jar, totalWishValue = 0, isOwn, followerCount, isFollowing, currentUserId }: JarCardProps) {
  const [following, setFollowing] = useState(isFollowing ?? false);
  const [count, setCount] = useState(followerCount ?? 0);
  const showFollow = !isOwn && !!currentUserId && isFollowing !== undefined;

  const isCompleted = jar.status === "completed";
  const progressPct =
    jar.goal_amount && jar.goal_amount > 0
      ? Math.min(Math.round((totalWishValue / jar.goal_amount) * 100), 100)
      : 0;
  const illustrationVariant = isCompleted ? "full" : totalWishValue > 0 ? "partial" : "empty";

  const handleShare = () => {
    const url = `${window.location.origin}/jars/${jar.id}`;
    if (navigator.share) {
      navigator.share({ title: jar.title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: isCompleted ? "#F0D080" : "#FDFAF3",
        border: `1px solid ${isCompleted ? "#EDD98A" : "#E8DCBB"}`,
        boxShadow: "var(--wj-shadow)",
      }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-wj-muted">
          {isCompleted ? completedLabel(jar.completed_at) : "Jar update"}
        </span>
        <span className="text-wj-muted text-lg leading-none select-none">•••</span>
      </div>

      {/* Main content row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AvatarCircle name={jar.username} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-wj-text truncate">
                by @{jar.username}
                {jar.isVerified && <span title="Verified account" className="ml-1 text-wj-plum">✓</span>}
              </p>
              <p className="text-xs text-wj-muted truncate">{jar.title}</p>
              <p className="text-[11px] text-wj-muted mt-0.5">
                {count} {count === 1 ? "supporter" : "supporters"}
              </p>
            </div>
          </div>

          {isCompleted ? (
            <>
              <h3 className="text-lg font-bold text-wj-text mb-0.5">Jar complete 🎉</h3>
              <p className="text-sm font-semibold text-wj-text mb-0.5">{jar.title}</p>
              <p className="text-xs text-wj-muted">Reached 100%</p>
            </>
          ) : (
            <>
              {jar.description && (
                <p className="text-xs text-wj-text mb-2 line-clamp-2">{jar.description}</p>
              )}
              {jar.goal_amount && jar.goal_amount > 0 && (
                <div className="mb-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-wj-muted">
                      ${totalWishValue.toLocaleString()} / ${jar.goal_amount.toLocaleString()}
                    </span>
                    <span className="font-semibold text-wj-text">{progressPct}%</span>
                  </div>
                  <ProgressBar value={progressPct} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="shrink-0">
          <JarIllustration variant={illustrationVariant} size={80} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {isCompleted ? (
          <>
            <a
              href={`/jars/${jar.id}`}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-gold-card border border-wj-gold"
            >
              View Jar
            </a>
            {showFollow && (
              <FollowButton
                jarId={jar.id}
                userId={currentUserId!}
                following={following}
                onToggle={(next) => { setFollowing(next); setCount((c) => c + (next ? 1 : -1)); }}
              />
            )}
          </>
        ) : (
          <>
            <a
              href={`/jars/${jar.id}`}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border"
            >
              View Jar
            </a>
            {showFollow && (
              <FollowButton
                jarId={jar.id}
                userId={currentUserId!}
                following={following}
                onToggle={(next) => { setFollowing(next); setCount((c) => c + (next ? 1 : -1)); }}
              />
            )}
            <button
              onClick={handleShare}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border"
            >
              ⬆ Share
            </button>
          </>
        )}
      </div>
    </div>
  );
}
