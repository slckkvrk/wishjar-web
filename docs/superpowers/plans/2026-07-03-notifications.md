# Bildirimler (Notifications) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the bell icon on the home hero card a real destination — a `/notifications` page backed by an actual `notifications` table, populated by DB triggers for four event types (follow, new post, jar progress milestone, jar completion).

**Architecture:** A single `notifications` table, fan-out-on-write via four `security definer` Postgres trigger functions (same pattern as the existing `jar_follows_adjust_count()` trigger), a new `/notifications` page that lists + bulk-marks-read, and a small unread-dot query surfaced on the home hero card's bell icon.

**Tech Stack:** Next.js (App Router, client components), Supabase JS client + Postgres/RLS, TypeScript, `lucide-react` (already installed) for the `Bell` icon. No test framework in this repo — every task's verification step is a manual/browser check (see spec §6), not an automated test run.

## Global Constraints

- All four notification types never notify a user about their own action (`recipient_id <> actor_id`, or for milestone/completion which have no actor, this doesn't apply) (spec §2).
- Financial "destek oldu" notifications are explicitly out of scope this round; the `type` check constraint is written to allow adding `support` later without a migration rewrite (spec Overview, §4).
- All UI copy is English only — this is a site-wide rule, not specific to this feature (project convention, enforced throughout).
- `notifications` RLS: a user may only `SELECT`/`UPDATE` (to set `read_at`) rows where `recipient_id = auth.uid()`. No `INSERT`/`DELETE` policy for the `authenticated` role — all inserts happen via `security definer` trigger functions (spec §1).
- A jar's percent-milestone notification fires at most once per threshold crossing (25/50/75), tracked via `jars.last_milestone_notified`, which only increases — dropping back below a threshold and re-crossing it does not re-notify (spec §1, §5).
- No automated tests exist in this repo; every task ends with a manual browser/SQL check, not a test run (spec §6).

---

## Task 1: Database migration — `notifications` table, triggers, RLS

**Files:**
- Create: `supabase/migrations/20260703120000_notifications.sql`

**Interfaces:**
- Produces (used by Tasks 2–3): table `notifications(id uuid, recipient_id uuid, actor_id uuid, type text, jar_id uuid, post_id uuid, percent smallint, read_at timestamptz, created_at timestamptz)`; column `jars.last_milestone_notified integer not null default 0`.

Note: `supabase/` is entirely gitignored in this repo (see `.gitignore`) — every prior schema change in this project's history was applied the same way (ad-hoc, not committed as a tracked migration file). This task follows that convention: the SQL lives in this plan (tracked via git) and is applied locally/manually; there is no `git commit` step for the `.sql` file itself.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260703120000_notifications.sql`:

```sql
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('follow','new_post','jar_milestone','jar_completed')),
  jar_id uuid references jars(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  percent smallint,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on notifications (recipient_id) where read_at is null;

create index if not exists wishes_jar_id_idx on wishes (jar_id);

alter table jars add column if not exists last_milestone_notified integer not null default 0;

alter table notifications enable row level security;

drop policy if exists "Users can view their own notifications" on notifications;
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "Users can mark their own notifications read" on notifications;
create policy "Users can mark their own notifications read"
  on notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- 1. Someone follows your jar.
create or replace function notify_on_jar_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from jars where id = new.jar_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into notifications (recipient_id, actor_id, type, jar_id)
    values (owner_id, new.user_id, 'follow', new.jar_id);
  end if;
  return new;
end;
$$;

drop trigger if exists jar_follows_notify_trigger on jar_follows;
create trigger jar_follows_notify_trigger
  after insert on jar_follows
  for each row execute function notify_on_jar_follow();

-- 2. A jar you follow gets a new post.
create or replace function notify_on_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.jar_id is not null then
    insert into notifications (recipient_id, actor_id, type, jar_id, post_id)
    select jf.user_id, new.user_id, 'new_post', new.jar_id, new.id
    from jar_follows jf
    where jf.jar_id = new.jar_id and jf.user_id <> new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_notify_trigger on posts;
create trigger posts_notify_trigger
  after insert on posts
  for each row execute function notify_on_new_post();

-- 3. A jar you follow crosses a 25/50/75% funding milestone.
-- Wish rows don't change which jar they belong to in this app (the edit-wish
-- page never updates jar_id), so on UPDATE we only need new.jar_id.
create or replace function notify_on_wish_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_jar_id uuid;
  goal numeric;
  total numeric;
  pct integer;
  last_notified integer;
  threshold integer;
begin
  if tg_op = 'DELETE' then
    target_jar_id := old.jar_id;
  else
    target_jar_id := new.jar_id;
  end if;

  select goal_amount, last_milestone_notified into goal, last_notified
  from jars where id = target_jar_id;

  if goal is not null and goal > 0 then
    select coalesce(sum(price), 0) into total from wishes where jar_id = target_jar_id;
    pct := least(floor(total / goal * 100), 100);

    -- Only the highest newly-crossed threshold notifies, even if a single
    -- edit jumps past more than one (e.g. 10% -> 80% notifies 75, not 25 and 50 too).
    threshold := null;
    if pct >= 75 and last_notified < 75 then
      threshold := 75;
    elsif pct >= 50 and last_notified < 50 then
      threshold := 50;
    elsif pct >= 25 and last_notified < 25 then
      threshold := 25;
    end if;

    if threshold is not null then
      insert into notifications (recipient_id, type, jar_id, percent)
      select jf.user_id, 'jar_milestone', target_jar_id, threshold
      from jar_follows jf
      where jf.jar_id = target_jar_id;

      update jars set last_milestone_notified = threshold where id = target_jar_id;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists wishes_notify_trigger on wishes;
create trigger wishes_notify_trigger
  after insert or update or delete on wishes
  for each row execute function notify_on_wish_change();

-- 4. A jar you follow is marked completed.
create or replace function notify_on_jar_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from 'completed' and new.status = 'completed' then
    insert into notifications (recipient_id, type, jar_id)
    select jf.user_id, 'jar_completed', new.id
    from jar_follows jf
    where jf.jar_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists jars_notify_completed_trigger on jars;
create trigger jars_notify_completed_trigger
  after update on jars
  for each row execute function notify_on_jar_completed();
```

`security definer` + fixed `search_path` on every function is required for the same reason as `jar_follows_adjust_count()`: these triggers insert rows on behalf of a *different* user (the recipient), and `notifications`' own RLS `select`/`update` policies are scoped to `recipient_id = auth.uid()` — without `security definer` the insert would run as the acting user and be silently blocked.

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`

If that fails with an auth error (not logged in / project not linked in this shell), open the Supabase Studio SQL Editor for project `wkqblgefvcvzufbqdbie` and paste the contents of the file, then run it. Expected: no errors; "Success. No rows returned" (or equivalent) for each statement.

- [ ] **Step 3: Verify the follow and new-post triggers via SQL**

In the Supabase Studio SQL Editor, pick a real jar id you don't own and a real second user id (`select id, user_id from jars limit 5;`, `select id from auth.users limit 5;`), then:

```sql
insert into jar_follows (user_id, jar_id) values ('<other-user-id>', '<jar-id>');
select type, recipient_id, actor_id, jar_id from notifications where jar_id = '<jar-id>' order by created_at desc limit 1;
```
Expected: one row, `type = 'follow'`, `recipient_id` = the jar's owner, `actor_id = '<other-user-id>'`.

```sql
insert into posts (user_id, jar_id, content) values ('<jar-owner-id>', '<jar-id>', 'Test post for notification trigger');
select type, recipient_id, actor_id, post_id from notifications where type = 'new_post' and jar_id = '<jar-id>' order by created_at desc limit 1;
```
Expected: one row, `recipient_id = '<other-user-id>'` (the follower from the previous step), `actor_id = '<jar-owner-id>'`.

- [ ] **Step 4: Verify the milestone and completion triggers via SQL**

Pick a jar with `goal_amount` set (or `update jars set goal_amount = 100 where id = '<jar-id>';`), confirm `last_milestone_notified = 0`, then:

```sql
insert into wishes (jar_id, user_id, title, price) values ('<jar-id>', '<jar-owner-id>', 'Milestone test item', 30);
select last_milestone_notified from jars where id = '<jar-id>';
select type, percent from notifications where jar_id = '<jar-id>' and type = 'jar_milestone' order by created_at desc limit 1;
```
Expected: `last_milestone_notified = 25`, one `jar_milestone` row with `percent = 25` (30/100 = 30% crosses the 25 threshold).

```sql
insert into wishes (jar_id, user_id, title, price) values ('<jar-id>', '<jar-owner-id>', 'Milestone test item 2', 30);
select last_milestone_notified from jars where id = '<jar-id>';
```
Expected: still `25` (60% doesn't cross 50 yet... adjust the price upward if needed to confirm a second crossing) — add one more wish to push past 50 and confirm `last_milestone_notified` becomes `50` with exactly one new `jar_milestone` row (`percent = 50`).

```sql
update jars set status = 'completed', completed_at = now() where id = '<jar-id>';
select type from notifications where jar_id = '<jar-id>' and type = 'jar_completed';
```
Expected: one `jar_completed` row for `recipient_id = '<other-user-id>'`.

Clean up test rows afterward if this is a shared/production project (`delete from notifications where jar_id = '<jar-id>'`, `delete from wishes where title like 'Milestone test item%'`, revert `jars.status`/`goal_amount`/`last_milestone_notified` if you changed them for a real jar).

---

## Task 2: Bell icon → `/notifications`, with unread dot

**Files:**
- Modify: `src/components/HomeHeroCard.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `notifications` table from Task 1.
- Produces: `HomeHeroCard` gains an optional prop `hasUnreadNotifications?: boolean` (default `false`).

- [ ] **Step 1: Add the prop and unread dot to `HomeHeroCard`**

In `src/components/HomeHeroCard.tsx`, replace:

```tsx
type Props = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  manifestLine1: string | null;
  manifestLine2: string | null;
};

export default function HomeHeroCard({ userId, username, avatarUrl, manifestLine1, manifestLine2 }: Props) {
```

with:

```tsx
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
```

Replace the notifications `<a>`:

```tsx
            <a
              href="/feed"
              aria-label="Notifications"
              title="Notifications"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-wj-card-border bg-wj-card/85 text-wj-plum shadow-[0_5px_12px_rgba(64,35,20,0.08)] active:scale-[0.98]"
            >
              <Bell size={20} strokeWidth={2.1} />
            </a>
```

with:

```tsx
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
```

- [ ] **Step 2: Fetch unread state in the dashboard and pass it down**

In `src/app/dashboard/page.tsx`, add new state alongside the existing `useState` calls:

```ts
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
```

Replace the `Promise.all` fetch:

```ts
      const [{ data: profile }, { data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase.from("profiles").select("avatar_url, manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, user_id, jar_id, content, created_at").order("created_at", { ascending: false }).limit(50),
      ]);
```

with:

```ts
      const [{ data: profile }, { data: jarsData }, { data: rawPosts }, { data: unreadNotifications }] = await Promise.all([
        supabase.from("profiles").select("avatar_url, manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, user_id, jar_id, content, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("notifications").select("id").eq("recipient_id", auth.userId).is("read_at", null).limit(1),
      ]);
```

Replace:

```ts
      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(profile?.manifest_line1 ?? null);
      setManifestLine2(profile?.manifest_line2 ?? null);
      setMyJars(jarsData ?? []);
```

with:

```ts
      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(profile?.manifest_line1 ?? null);
      setManifestLine2(profile?.manifest_line2 ?? null);
      setMyJars(jarsData ?? []);
      setHasUnreadNotifications((unreadNotifications ?? []).length > 0);
```

Replace the `<HomeHeroCard>` render:

```tsx
      <HomeHeroCard
        userId={userId!}
        username={username ?? "there"}
        avatarUrl={avatarUrl}
        manifestLine1={manifestLine1}
        manifestLine2={manifestLine2}
      />
```

with:

```tsx
      <HomeHeroCard
        userId={userId!}
        username={username ?? "there"}
        avatarUrl={avatarUrl}
        manifestLine1={manifestLine1}
        manifestLine2={manifestLine2}
        hasUnreadNotifications={hasUnreadNotifications}
      />
```

- [ ] **Step 3: Verify manually in the browser**

Precondition: Task 1 applied, and at least one unread row exists for the signed-in user (e.g. have a second test account follow one of your jars).

1. Visit `/dashboard`. Confirm the bell icon shows a small red dot.
2. Click the bell → confirm it navigates to `/notifications` (page doesn't exist until Task 3; a 404 here is expected and fine at this point in the plan).
3. In Supabase Studio, run `update notifications set read_at = now() where recipient_id = '<your-id>';`, reload `/dashboard` → confirm the red dot is gone.

---

## Task 3: `/notifications` page

**Files:**
- Create: `src/components/NotificationRow.tsx`
- Create: `src/app/notifications/page.tsx`

**Interfaces:**
- Consumes: `notifications` table from Task 1.
- Produces: `NotificationRow` component —
  ```ts
  export type NotificationItem = {
    id: string;
    type: "follow" | "new_post" | "jar_milestone" | "jar_completed";
    actorUsername: string | null;
    jarId: string | null;
    jarTitle: string | null;
    percent: number | null;
    createdAt: string;
  };
  export default function NotificationRow(props: { notification: NotificationItem }): JSX.Element
  ```

- [ ] **Step 1: Create `NotificationRow`**

Create `src/components/NotificationRow.tsx`:

```tsx
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
```

- [ ] **Step 2: Create the `/notifications` page**

Create `src/app/notifications/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Run the TypeScript compiler**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify manually in the browser**

Precondition: Task 1 applied, Task 2 done, and at least one notification of each type exists for the signed-in user (use the SQL from Task 1 Steps 3–4, or generate them for real via a second test account: follow a jar, post to a followed jar, add wishes past a threshold, mark a followed jar completed).

1. Sign in, click the bell on `/dashboard` → lands on `/notifications`.
2. Confirm each notification renders the correct English sentence for its type (follow / new_post / jar_milestone / jar_completed) and links to the right jar (`/jars/<id>`).
3. Reload `/dashboard` → confirm the red dot is now gone (the page visit marked everything read).
4. Sign in as a fresh user with zero notifications, visit `/notifications` directly → confirm "No new notifications." renders and no error appears.
5. Temporarily rename the `notifications` table in Supabase Studio (`alter table notifications rename to notifications_tmp;`) to force a fetch error, reload `/notifications` → confirm the red error message renders instead of a crash. Rename it back (`alter table notifications_tmp rename to notifications;`) afterward.

---

## Self-Review Notes

- **Spec coverage:** §1 (data model, RLS) → Task 1. §2 (triggers, all 4 types) → Task 1. §3 (bell → `/notifications`, unread dot, page behavior, copy, empty state, error state) → Tasks 2–3. §4 (scope exclusions — no `support` type, no push/email, no per-item read toggle, no pagination) → respected throughout. §5 (edge cases — monotonic milestone, cascade deletes, null `goal_amount`) → Task 1's trigger logic. §6 (manual verification) → every task's last step.
- **Type consistency:** `NotificationItem` identical across Task 3's `NotificationRow` definition and the page's mapping. `hasUnreadNotifications` prop name identical across Task 2's `HomeHeroCard` definition and `dashboard/page.tsx` usage.
- **No placeholders:** every step has literal SQL/TypeScript; no "add error handling" or "similar to Task N" placeholders.
