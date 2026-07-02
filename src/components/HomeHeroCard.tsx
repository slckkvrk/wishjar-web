import { Bell, Settings } from "lucide-react";
import EditableAvatar from "./EditableAvatar";
import ManifestoText from "./ManifestoText";

type Props = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  manifestLine1: string | null;
  manifestLine2: string | null;
  hasUnreadNotifications?: boolean;
};

export default function HomeHeroCard({
  userId, username, avatarUrl, manifestLine1, manifestLine2, hasUnreadNotifications = false,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-b-[34px] md:rounded-3xl mx-4 md:mx-auto md:max-w-5xl mt-4 mb-4 bg-wj-cream px-5 pb-7 pt-6 shadow-[inset_0_-1px_0_rgba(92,55,38,0.08)]">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-wj-gold-light/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-white/55 blur-3xl" />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-4xl md:text-5xl leading-none tracking-tight text-wj-plum">
            WishJar
            <span className="ml-1 align-top text-xl text-wj-gold">✦</span>
          </h1>

          <div className="flex gap-2">
            <a
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-wj-card-border bg-wj-card/85 text-wj-plum shadow-[0_5px_12px_rgba(64,35,20,0.08)] active:scale-[0.98]"
            >
              <Settings size={20} strokeWidth={2.1} />
            </a>
            <a
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-wj-card-border bg-wj-card/85 text-wj-plum shadow-[0_5px_12px_rgba(64,35,20,0.08)] active:scale-[0.98]"
            >
              <Bell size={20} strokeWidth={2.1} />
              {hasUnreadNotifications && (
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-wj-card bg-red-500" />
              )}
            </a>
          </div>
        </div>

        {/* User + jar area */}
        <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-full border-[3px] border-wj-gold shadow-sm">
              <EditableAvatar userId={userId} username={username} avatarUrl={avatarUrl} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-wj-text">Hi, {username}</h2>
              <ManifestoText line1={manifestLine1} line2={manifestLine2} />
            </div>
          </div>

          <div className="relative flex justify-end">
            <span className="pointer-events-none absolute -right-1 -top-2 text-sm text-wj-gold" aria-hidden="true">✦</span>
            <span className="pointer-events-none absolute -left-2 top-9 text-xs text-wj-gold/70" aria-hidden="true">✦</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/wishjar-header-jar.png"
              alt=""
              aria-hidden="true"
              className="w-[110px] h-auto drop-shadow-[0_10px_16px_rgba(89,50,25,0.16)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
