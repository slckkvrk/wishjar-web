# Jar Follow (Takip) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users follow/unfollow jars, and blend followed + popular + completed jars into a single weighted feed.

**Architecture:** A new `jar_follows` join table plus a denormalized `jars.follower_count` counter (kept in sync by a DB trigger) back a reusable `FollowButton` component. `JarCard` and the jar detail page render it. The feed page fetches three sorted buckets (followed / popular / completed) and interleaves them client-side with a small pure helper.

**Tech Stack:** Next.js (App Router, client components), Supabase JS client + Postgres/RLS, TypeScript. No test framework in this repo — every task's verification step is a manual/browser check (see spec §6), not an automated test run.

## Global Constraints

- Jar-level follow only — no user-level follow (spec §1, out of scope in §4).
- Popularity ranking uses `jars.follower_count` (denormalized counter + trigger), never a live `COUNT(*)` (spec §1).
- `jar_follows` RLS: a user may only `SELECT`/`INSERT`/`DELETE` rows where `user_id = auth.uid()` (spec §1).
- Feed is a single blended stream, ratio **2 Takip Edilen : 2 Popüler : 1 Tamamlanan** per 5 cards; if a bucket runs out, the other buckets fill its slots (spec §3).
- No per-card "why am I seeing this" source label — cards stay visually plain (spec §2).
- No standalone "Takip Ettiğim Jar'lar" page — the feed section is enough (spec §4).
- Jar owner cannot follow their own jar — enforced at the UI layer only, consistent with this project's existing C1–C3 security pattern (spec §5).
- No automated tests exist in this repo; every task ends with a manual browser check, not a test run (spec §6).

---

## Task 1: Database migration — `jar_follows` table, `follower_count`, trigger, RLS

**Files:**
- Create: `supabase/migrations/20260702120000_jar_follows.sql`

**Interfaces:**
- Produces (used by Tasks 2–4): table `jar_follows(user_id uuid, jar_id uuid, created_at timestamptz)`, primary key `(user_id, jar_id)`; column `jars.follower_count integer not null default 0`, auto-maintained.

Note: `supabase/` is entirely gitignored in this repo (see `.gitignore`, commit `a6daf5a`) — every prior schema change in this project's history was applied the same way (ad-hoc, not committed as a tracked migration file). This task follows that convention: the SQL lives in this plan (tracked via git) and is applied locally/manually; there is no `git commit` step for the `.sql` file itself.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260702120000_jar_follows.sql`:

```sql
create table if not exists jar_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  jar_id uuid not null references jars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, jar_id)
);

alter table jars add column if not exists follower_count integer not null default 0;

create or replace function jar_follows_adjust_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update jars set follower_count = follower_count + 1 where id = new.jar_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update jars set follower_count = follower_count - 1 where id = old.jar_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists jar_follows_count_trigger on jar_follows;
create trigger jar_follows_count_trigger
  after insert or delete on jar_follows
  for each row execute function jar_follows_adjust_count();

alter table jar_follows enable row level security;

drop policy if exists "Users can view their own follows" on jar_follows;
create policy "Users can view their own follows"
  on jar_follows for select
  using (auth.uid() = user_id);

drop policy if exists "Users can follow jars" on jar_follows;
create policy "Users can follow jars"
  on jar_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow jars" on jar_follows;
create policy "Users can unfollow jars"
  on jar_follows for delete
  using (auth.uid() = user_id);
```

`security definer` + fixed `search_path` on the trigger function is required: the trigger fires under the *follower's* role (not the jar owner's), and `jars` already has an RLS `UPDATE` policy scoped to the jar owner — without `security definer` the counter update would be silently blocked by that policy for anyone following someone else's jar.

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`

If that fails with an auth error (not logged in / project not linked in this shell), open the Supabase Studio SQL Editor for project `wkqblgefvcvzufbqdbie` and paste the contents of the file, then run it. Expected: no errors; "Success. No rows returned" (or equivalent) for each statement.

- [ ] **Step 3: Verify manually via SQL**

In the Supabase Studio SQL Editor (or `npx supabase db push` output), run:

```sql
select follower_count from jars limit 1;
```
Expected: succeeds, returns a numeric column (existing jars show `0`).

Pick any real jar id and any real user id that does **not** own it (`select id, user_id from jars limit 5;` and `select id from auth.users limit 5;` if needed), then:

```sql
insert into jar_follows (user_id, jar_id) values ('<other-user-id>', '<jar-id>');
select follower_count from jars where id = '<jar-id>';
```
Expected: `follower_count` is now `1` more than before the insert.

```sql
delete from jar_follows where user_id = '<other-user-id>' and jar_id = '<jar-id>';
select follower_count from jars where id = '<jar-id>';
```
Expected: `follower_count` back to its original value.

---

## Task 2: `FollowButton` component + jar detail page integration

**Files:**
- Create: `src/components/FollowButton.tsx`
- Modify: `src/app/jars/[id]/page.tsx`

**Interfaces:**
- Consumes: `jar_follows` table and `jars.follower_count` from Task 1.
- Produces (used by Task 3): `FollowButton` component —
  ```ts
  type FollowButtonProps = {
    jarId: string;
    userId: string;
    following: boolean;
    onToggle: (nowFollowing: boolean) => void;
  };
  export default function FollowButton(props: FollowButtonProps): JSX.Element
  ```
  It is a **controlled** component: the parent owns `following`/count state, `FollowButton` only calls `onToggle` optimistically and rolls back by calling `onToggle` again if the Supabase call fails.

- [ ] **Step 1: Create `FollowButton`**

Create `src/components/FollowButton.tsx`:

```tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type FollowButtonProps = {
  jarId: string;
  userId: string;
  following: boolean;
  onToggle: (nowFollowing: boolean) => void;
};

export default function FollowButton({ jarId, userId, following, onToggle }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const nextFollowing = !following;
    onToggle(nextFollowing);

    const { error } = nextFollowing
      ? await supabase.from("jar_follows").insert({ user_id: userId, jar_id: jarId })
      : await supabase.from("jar_follows").delete().eq("user_id", userId).eq("jar_id", jarId);

    setLoading(false);
    if (error) onToggle(following);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex-1 py-2 text-sm font-semibold text-center rounded-xl border disabled:opacity-60 ${
        following
          ? "text-wj-plum bg-wj-card border-wj-plum"
          : "text-white bg-wj-plum border-wj-plum"
      }`}
    >
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}
```

- [ ] **Step 2: Extend the `Jar` type and select query in the detail page**

Modify `src/app/jars/[id]/page.tsx`. Replace:

```ts
type Jar = {
  id: string; title: string; description: string | null; category: string;
  goal_amount: number | null; created_at: string; user_id: string; status: string;
};
```

with:

```ts
type Jar = {
  id: string; title: string; description: string | null; category: string;
  goal_amount: number | null; created_at: string; user_id: string; status: string;
  follower_count: number;
};
```

Replace the select query:

```ts
      const { data, error } = await supabase
        .from("jars").select("id, title, description, category, goal_amount, created_at, user_id, status")
        .eq("id", jarId).single();
```

with:

```ts
      const { data, error } = await supabase
        .from("jars").select("id, title, description, category, goal_amount, created_at, user_id, status, follower_count")
        .eq("id", jarId).single();
```

- [ ] **Step 3: Add follow state and fetch it**

Add new state alongside the existing `useState` calls:

```ts
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
```

In the `load` function, right after `setJar(data); setIsOwner(data.user_id === auth.userId);`, add:

```ts
      setCurrentUserId(auth.userId);
      setFollowerCount(data.follower_count);
      if (data.user_id !== auth.userId) {
        const { data: followRow } = await supabase
          .from("jar_follows").select("user_id")
          .eq("user_id", auth.userId).eq("jar_id", jarId).maybeSingle();
        setFollowing(!!followRow);
      }
```

- [ ] **Step 4: Import `FollowButton` and render it (mobile hero)**

Add the import at the top:

```ts
import FollowButton from "@/components/FollowButton";
```

In the mobile hero block, immediately after the closing of the `goal_amount` progress `div` and before the closing `</div>` of the `flex-1 pr-4` container (right before `{isOwner && (` for the mobile action row), add:

```tsx
            {!isOwner && currentUserId && (
              <div className="mt-3 flex items-center gap-2">
                <FollowButton
                  jarId={jar.id}
                  userId={currentUserId}
                  following={following}
                  onToggle={(next) => {
                    setFollowing(next);
                    setFollowerCount((c) => c + (next ? 1 : -1));
                  }}
                />
                <span className="text-xs text-wj-muted whitespace-nowrap">
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </span>
              </div>
            )}
```

- [ ] **Step 5: Render the same block in the desktop sidebar**

In the desktop sidebar block, immediately after the closing of the `goal_amount` progress `div` and before `{isOwner && (` (the desktop owner-actions block), add the identical JSX block from Step 4.

- [ ] **Step 6: Verify manually in the browser**

Preconditions: the Supabase project has at least two user accounts, and at least one jar owned by a user other than the one you'll sign in as.

1. Sign in and navigate to `/jars/<id>` for a jar you do **not** own.
2. Confirm a "+ Follow" button and a "N followers" count are visible.
3. Click it → button becomes "✓ Following", count increments by 1.
4. Reload the page → still shows "✓ Following" with the incremented count (confirms the row persisted and Task 1's trigger fired).
5. Click again → reverts to "+ Follow", count decrements.
6. Navigate to a jar you **do** own → confirm no Follow button/count row is rendered.

---

## Task 3: `JarCard` follow support

**Files:**
- Modify: `src/components/JarCard.tsx`

**Interfaces:**
- Consumes: `FollowButton` from Task 2, exact props `{ jarId, userId, following, onToggle }`.
- Produces (used by Task 4): updated `JarCardProps`:
  ```ts
  type JarCardProps = {
    jar: {
      id: string; title: string; description: string | null; category: string;
      goal_amount: number | null; status: string; username: string;
      completed_at?: string | null;
    };
    totalWishValue?: number;
    isOwn?: boolean;
    followerCount?: number;
    isFollowing?: boolean;
    currentUserId?: string;
  };
  ```
  `followerCount`/`isFollowing`/`currentUserId` are all optional so existing call sites (e.g. `dashboard/page.tsx`, which only passes `isOwn`) keep compiling unchanged.

- [ ] **Step 1: Add imports and new props**

In `src/components/JarCard.tsx`, add at the top:

```ts
import { useState } from "react";
import FollowButton from "./FollowButton";
```

Replace the `JarCardProps` type:

```ts
type JarCardProps = {
  jar: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    goal_amount: number | null;
    status: string;
    username: string;
    completed_at?: string | null;
  };
  totalWishValue?: number;
  isOwn?: boolean;
};
```

with:

```ts
type JarCardProps = {
  jar: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    goal_amount: number | null;
    status: string;
    username: string;
    completed_at?: string | null;
  };
  totalWishValue?: number;
  isOwn?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
  currentUserId?: string;
};
```

- [ ] **Step 2: Own follow/count state inside `JarCard`**

Replace the function signature:

```ts
export default function JarCard({ jar, totalWishValue = 0, isOwn }: JarCardProps) {
```

with:

```ts
export default function JarCard({ jar, totalWishValue = 0, isOwn, followerCount, isFollowing, currentUserId }: JarCardProps) {
  const [following, setFollowing] = useState(isFollowing ?? false);
  const [count, setCount] = useState(followerCount ?? 0);
  const showFollow = !isOwn && !!currentUserId && isFollowing !== undefined;
```

(keep the existing `const isCompleted = ...` line and everything after it unchanged, right below this).

- [ ] **Step 3: Show the follower count next to the title**

Replace:

```tsx
            <div className="min-w-0">
              <p className="text-sm font-bold text-wj-text truncate">{jar.username}</p>
              <p className="text-xs text-wj-muted truncate">{jar.title}</p>
            </div>
```

with:

```tsx
            <div className="min-w-0">
              <p className="text-sm font-bold text-wj-text truncate">{jar.username}</p>
              <p className="text-xs text-wj-muted truncate">{jar.title}</p>
              {followerCount !== undefined && (
                <p className="text-[11px] text-wj-muted mt-0.5">
                  {count} {count === 1 ? "follower" : "followers"}
                </p>
              )}
            </div>
```

- [ ] **Step 4: Render `FollowButton` in both action rows**

Replace the action buttons block:

```tsx
      <div className="flex gap-2 mt-3">
        {isCompleted ? (
          <a
            href={`/jars/${jar.id}`}
            className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-gold-card border border-wj-gold"
          >
            View Jar
          </a>
        ) : (
          <>
            <a
              href={`/jars/${jar.id}`}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border"
            >
              View Jar
            </a>
            <button
              onClick={handleShare}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border"
            >
              ⬆ Share
            </button>
          </>
        )}
      </div>
```

with:

```tsx
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
```

- [ ] **Step 5: Verify no regression on the dashboard**

Run `npm run dev` (or reuse an already-running instance), sign in, visit `/dashboard`. Confirm your own jar cards render exactly as before (title, progress bar, "View Jar"/"Share" buttons) with no Follow button and no follower-count line — `dashboard/page.tsx` only passes `isOwn`, so `followerCount`/`isFollowing`/`currentUserId` are `undefined` and both new UI pieces stay hidden. This is the only consumer of `JarCard` today besides the feed page rewritten in Task 4, so it's the regression check for this task.

---

## Task 4: Feed page — weighted blend of followed / popular / completed jars

**Files:**
- Create: `src/lib/interleave.ts`
- Modify: `src/app/feed/page.tsx`

**Interfaces:**
- Consumes: `jar_follows` + `jars.follower_count` (Task 1), updated `JarCard` props (Task 3).
- Produces: `interleaveByRatio<T>(buckets: T[][], pattern: number[]): T[]` — pure function, no dependencies.

- [ ] **Step 1: Write the interleave helper**

Create `src/lib/interleave.ts`:

```ts
export function interleaveByRatio<T>(buckets: T[][], pattern: number[]): T[] {
  const queues = buckets.map((bucket) => [...bucket]);
  const result: T[] = [];
  let patternIdx = 0;

  while (queues.some((queue) => queue.length > 0)) {
    const preferred = pattern[patternIdx % pattern.length];
    patternIdx++;
    const order = [preferred, ...queues.map((_, i) => i).filter((i) => i !== preferred)];
    for (const i of order) {
      if (queues[i].length > 0) {
        result.push(queues[i].shift() as T);
        break;
      }
    }
  }

  return result;
}
```

This fills 2 slots from bucket 0, 2 from bucket 1, 1 from bucket 2 per 5-item cycle (pattern `[0, 1, 0, 1, 2]`, applied in Step 3 below). If a preferred bucket is empty, it falls through to the next non-empty bucket in fixed order — so a user who follows nothing still gets a full feed from popular + completed.

- [ ] **Step 2: Replace the feed page's data types**

In `src/app/feed/page.tsx`, replace:

```ts
type FeedJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string;
};
```

with:

```ts
type FeedJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string; follower_count: number;
  completed_at?: string | null;
};
```

Add the import:

```ts
import { interleaveByRatio } from "@/lib/interleave";
```

- [ ] **Step 3: Replace the jar-fetching logic**

Replace the whole block from `const { data: allJars } = await supabase` down to (and including) `setFeedJars(trending);` — i.e. everything between `if (!auth) return;` and the `const { data: rawPosts } = ...` line — with:

```ts
      const { data: followRows } = await supabase
        .from("jar_follows").select("jar_id").eq("user_id", auth.userId);
      const followedIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedSet = new Set(followedIds);
      setFollowedIds(followedSet);
      setCurrentUserId(auth.userId);

      const jarColumns = "id, title, description, category, goal_amount, user_id, follower_count, status";

      const [{ data: followedJarsRaw }, { data: popularJarsRaw }, { data: completedJarsRaw }] = await Promise.all([
        followedIds.length > 0
          ? supabase.from("jars").select(jarColumns)
              .in("id", followedIds).eq("status", "active")
              .order("created_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        supabase.from("jars").select(jarColumns)
          .eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(`${jarColumns}, completed_at`)
          .eq("status", "completed").neq("user_id", auth.userId)
          .order("completed_at", { ascending: false }).limit(20),
      ]);

      const allRaw = [
        ...(followedJarsRaw ?? []),
        ...(popularJarsRaw ?? []),
        ...(completedJarsRaw ?? []),
      ] as Array<{
        id: string; title: string; description: string | null; category: string;
        goal_amount: number | null; user_id: string; follower_count: number;
        status: string; completed_at?: string | null;
      }>;

      const jarIds = [...new Set(allRaw.map((j) => j.id))];
      const ownerIds = [...new Set(allRaw.map((j) => j.user_id))];

      const [{ data: wishData }, { data: jarProfiles }] = await Promise.all([
        jarIds.length > 0 ? supabase.from("wishes").select("jar_id, price").in("jar_id", jarIds) : Promise.resolve({ data: [] }),
        ownerIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", ownerIds) : Promise.resolve({ data: [] }),
      ]);

      const valueMap: Record<string, number> = {};
      (wishData ?? []).forEach((w) => {
        valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0);
      });
      setWishValueMap(valueMap);

      const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));

      const toFeedJar = (j: (typeof allRaw)[number]): FeedJar => ({
        id: j.id, title: j.title, description: j.description ?? null,
        category: j.category, goal_amount: j.goal_amount,
        status: j.status, username: profileMap[j.user_id] ?? "?",
        follower_count: j.follower_count ?? 0,
        completed_at: j.completed_at ?? null,
      });

      const followedBucket = (followedJarsRaw ?? []).map((j) => toFeedJar(j as (typeof allRaw)[number]));
      const popularBucket = (popularJarsRaw ?? []).map((j) => toFeedJar(j as (typeof allRaw)[number]));
      const completedBucket = (completedJarsRaw ?? []).map((j) => toFeedJar(j as (typeof allRaw)[number]));

      setPopularJars(popularBucket);
      setFeedJars(interleaveByRatio([followedBucket, popularBucket, completedBucket], [0, 1, 0, 1, 2]));
```

Note: the followed-jars query does not `neq("user_id", auth.userId)` — a user cannot follow their own jar (enforced at the UI layer, Task 2/3), so `jar_follows` should never contain a row pointing at the viewer's own jar.

- [ ] **Step 4: Add the new state**

Alongside the existing `useState` calls, add:

```ts
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [popularJars, setPopularJars] = useState<FeedJar[]>([]);
```

- [ ] **Step 5: Pass the new props to `JarCard`**

Replace:

```tsx
              {feedJars.map((jar) => (
                <JarCard key={jar.id} jar={jar} totalWishValue={wishValueMap[jar.id] ?? 0} />
              ))}
```

with:

```tsx
              {feedJars.map((jar) => (
                <JarCard
                  key={jar.id}
                  jar={jar}
                  totalWishValue={wishValueMap[jar.id] ?? 0}
                  followerCount={jar.follower_count}
                  isFollowing={followedIds.has(jar.id)}
                  currentUserId={currentUserId ?? undefined}
                />
              ))}
```

- [ ] **Step 6: Fix the desktop "Trending Jars" sidebar to use the real popular bucket**

`feedJars` is now a blended stream, not a popularity ranking, so the sidebar must read from `popularJars` instead. Replace:

```tsx
            {feedJars.length === 0 ? (
              <p className="text-xs text-wj-muted">No jars yet.</p>
            ) : feedJars.slice(0, 5).map((jar) => (
```

with:

```tsx
            {popularJars.length === 0 ? (
              <p className="text-xs text-wj-muted">No jars yet.</p>
            ) : popularJars.slice(0, 5).map((jar) => (
```

- [ ] **Step 7: Verify manually in the browser**

Preconditions: sign in as a user who (a) follows at least 2–3 active jars, (b) has several other active jars in the system (for the popular bucket) and (c) has at least one completed jar visible (for the completed bucket). Adjust follows via the Task 2/3 UI if you need more test data.

1. Visit `/feed`. Confirm it loads without errors and shows a single list of jar cards (no separate "Takip Ettiğim" section — matches spec).
2. For each visible card, note whether its id is in your followed set, or has a high `follower_count`, or `status === "completed"` (check via Supabase Studio if unsure) — confirm the first 5 cards roughly follow the 2:2:1 pattern (2 you follow, 2 high-follower-count, 1 completed), not a strict repeat if a bucket is short.
3. Click "Follow"/"Unfollow" directly on a card in the feed — confirm the button and follower count update in place (Task 3's `FollowButton` wiring working inside a list, not just standalone).
4. Temporarily note a jar you follow, unfollow all jars via Supabase Studio (`delete from jar_follows where user_id = '<your-id>'`), reload `/feed` — confirm the feed still fills completely from popular + completed (no gaps, no crash). Re-follow afterward if you want your test data back.
5. Confirm the desktop "Trending Jars" sidebar (resize window or check `md:` breakpoint) lists jars ordered by follower count, not the blended order.

---

## Self-Review Notes

- **Spec coverage:** §1 (data model + RLS) → Task 1. §2 (UI) → Tasks 2–3. §3 (feed blend + ratio + fallback) → Task 4. §4 (scope exclusions) → respected throughout (no user-follow, no ranking system, no notifications, no public follower list, no dedicated follow-list page, no infinite scroll). §5 (edge cases) → PK constraint (Task 1), cascade deletes (Task 1), UI-layer-only owner guard (Tasks 2–3), empty-bucket fallback (Task 4). §6 (manual browser verification) → every task's last step.
- **Type consistency:** `FollowButtonProps` identical across Task 2 (definition) and Tasks 3–4 (usage). `JarCardProps` additions identical across Task 3 (definition) and Task 4 (usage). `interleaveByRatio<T>` signature identical across Task 4's definition and usage.
- **No placeholders:** every step has literal code; no "add error handling" or "similar to Task N" placeholders.
