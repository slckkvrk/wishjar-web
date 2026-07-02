import EditableAvatar from "./EditableAvatar";
import ManifestoText from "./ManifestoText";

type Props = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  manifestLine1: string | null;
  manifestLine2: string | null;
};

export default function HomeHeroCard({ userId, username, avatarUrl, manifestLine1, manifestLine2 }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl mx-4 md:mx-auto md:max-w-5xl mt-4 mb-4 px-5 py-5"
      style={{ background: "linear-gradient(135deg, var(--wj-hero-grad-start), var(--wj-hero-grad-end))" }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <a
          href="/feed"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 text-base"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
        </a>
        <a
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 text-base"
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </a>
      </div>

      <div className="flex items-center gap-4 pr-20">
        <EditableAvatar userId={userId} username={username} avatarUrl={avatarUrl} />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-wj-text">Hi, {username}</h1>
          <ManifestoText line1={manifestLine1} line2={manifestLine2} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-5xl leading-none select-none" aria-hidden="true">
        <span className="relative">
          🫙<span className="absolute -top-2 -right-1 text-2xl">✨</span>
        </span>
        <span>🎁</span>
        <span>🌿</span>
      </div>
    </div>
  );
}
