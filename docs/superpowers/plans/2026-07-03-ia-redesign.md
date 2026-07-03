# IA Redesign (Home / Jars / Create / Profile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Without touching the visual theme, fix WishJar's information architecture: Home becomes a real followed/popular/completed timeline at `/`, Jars becomes a discovery page, posts require a jar, jar creation requires account verification, and the profile header becomes trust-focused (cover template, name, location, contact, socials, verified badge). Also closes a live privacy gap where `manifest_line1`/`manifest_line2` are readable by the `anon` role with no auth.

**Architecture:** Additive DB migration (new `profiles` columns + a `BEFORE` trigger that computes `is_verified` + two views that replace direct `manifest_line1/2`/`phone` reads), a route move (`/dashboard` content moves into `/`, `/dashboard` and `/feed` become redirect stubs), reuse of the existing `interleaveByRatio` helper applied to posts instead of jars, and a handful of new small presentational components (`HowItWorksBar`, `VerificationGate`, `CoverPicker`, `ProfileHeader`).

**Tech Stack:** Next.js (App Router, client components, `"use client"` throughout — matches existing convention), Supabase JS + Postgres/RLS, TypeScript, Tailwind, `lucide-react` (already installed, already used in `HomeHeroCard.tsx`). No test framework in this repo — every task's verification step is `npx tsc --noEmit` plus a manual browser check, not an automated test run.

Source: `docs/superpowers/specs/2026-07-03-ia-redesign-design.md` (Approved, corrected 2026-07-03 against live code).

## Global Constraints

- Theme is untouched: no new colors, no new fonts, no spacing/radius/shadow changes. Every new component reuses existing Tailwind utility classes and CSS variables (`bg-wj-card`, `text-wj-plum`, `var(--wj-shadow)`, etc.) already used elsewhere in the codebase.
- All UI copy is English only — site-wide rule, not specific to this feature.
- No automated tests exist in this repo; every task ends with `npx tsc --noEmit` + a manual browser check, not a test run.
- **Migration-before-code-breaks-nothing rule:** until the DB migration (Task 1) is applied by the human to the live Supabase project, every new query added by this plan must degrade gracefully (missing feature, not a broken page). Concretely: never add a new/renamed column to the *same* `select()` call that fetches a page's core required fields (`id`, `username`, etc.) — Postgrest fails an entire query if any selected column doesn't exist yet, and a `.single()` call whose query errors returns `data: null`, which several existing pages (e.g. `/u/[username]`) already treat as "not found." New-field queries must be separate calls with their own null-safe fallback, exactly like the existing `notifications` unread-count query on the dashboard (`(unreadNotifications ?? []).length`).
- `posts.jar_id` becoming `NOT NULL` is **not** part of this plan's automated steps — Task 13 is a human-gated, separate, opt-in step (see spec §3 and §10: could delete live rows, requires a live count first).
- `supabase/` is gitignored in this repo (every prior migration in this project's history followed this convention) — the migration SQL in Task 1 lives in this plan (tracked via git) and is applied manually by the human in Supabase Studio; there is no `git commit` step for the `.sql` file itself, same as the notifications and jar-follow features.

## File Structure

New files:
- `supabase/migrations/20260703130000_ia_redesign_profile_trust_fields.sql` — profile columns, `is_verified` trigger, manifesto privacy views.
- `src/lib/coverTemplates.ts` — shared cover-template id → CSS background map (used by `CoverPicker` and `ProfileHeader`, avoids duplicating the 6-entry table).
- `src/components/HowItWorksBar.tsx` — dismissible "how it works" strip, `localStorage`-backed.
- `src/components/VerificationGate.tsx` — blocks jar creation for unverified users.
- `src/components/CoverPicker.tsx` — 6-template picker grid, used in `/settings/profile`.
- `src/components/ProfileHeader.tsx` — extracted + expanded profile header (cover, avatar, name, location, contact, socials, verified badge, bio), replaces the duplicated mobile/desktop header blocks in `/u/[username]/page.tsx`.

Modified files (grouped by task below): `src/lib/requireUsername.ts`, `src/components/BottomNav.tsx`, `src/components/SiteHeader.tsx`, `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/feed/page.tsx`, `src/app/jars/page.tsx`, `src/components/PostComposer.tsx`, `src/app/jars/new/page.tsx`, `src/components/JarCard.tsx`, `src/app/settings/profile/page.tsx`, `src/app/u/[username]/page.tsx`, `src/app/settings/page.tsx`, `src/app/jars/[id]/page.tsx`, `src/app/jars/[id]/edit/page.tsx`, `src/app/setup/username/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/login/page.tsx`, `src/app/notifications/page.tsx`.

---

## Task 1: Database migration — profile trust fields, verification trigger, manifesto privacy

**Files:**
- Create: `supabase/migrations/20260703130000_ia_redesign_profile_trust_fields.sql`

**Interfaces:**
- Produces (used by Tasks 2, 8, 10, 11): columns `profiles.first_name text`, `profiles.last_name text`, `profiles.city text`, `profiles.country text`, `profiles.phone text`, `profiles.is_verified boolean not null default false`, `profiles.cover_template text`, `profiles.social_instagram text`, `profiles.social_tiktok text`, `profiles.social_youtube text`, `profiles.social_facebook text`, `profiles.contact_email text`; views `profiles_public`, `profiles_private`.

This file is gitignored SQL applied manually by the human in Supabase Studio's SQL Editor (project `wkqblgefvcvzufbqdbie`), per this repo's established convention — no `git commit` step for it.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260703130000_ia_redesign_profile_trust_fields.sql`:

```sql
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists is_verified boolean not null default false;
alter table profiles add column if not exists cover_template text;
alter table profiles add column if not exists social_instagram text;
alter table profiles add column if not exists social_tiktok text;
alter table profiles add column if not exists social_youtube text;
alter table profiles add column if not exists social_facebook text;
alter table profiles add column if not exists contact_email text;

-- is_verified is always server-computed. A BEFORE trigger (not AFTER, unlike
-- jar_follows_adjust_count) rewrites NEW.is_verified before the row is ever
-- written, so a user's own update payload (e.g. `is_verified: true`) is fully
-- overwritten pre-write -- no window where an incorrect value is briefly
-- stored, unlike an AFTER-trigger-corrects-it-afterwards design.
create or replace function profiles_compute_is_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_verified := (
    coalesce(trim(new.first_name), '') <> '' and
    coalesce(trim(new.last_name), '') <> '' and
    coalesce(trim(new.city), '') <> '' and
    coalesce(trim(new.country), '') <> '' and
    coalesce(trim(new.phone), '') <> ''
  );
  return new;
end;
$$;

drop trigger if exists profiles_verification_trigger on profiles;
create trigger profiles_verification_trigger
  before insert or update on profiles
  for each row execute function profiles_compute_is_verified();

-- Manifesto privacy: manifest_line1/manifest_line2/phone are currently
-- readable by anon with no auth at all (verified live via REST during
-- spec-writing). Revoke direct column access, replace with two views.
revoke select (manifest_line1, manifest_line2, phone) on profiles from anon, authenticated;

create or replace view profiles_public as
select
  id, username, bio, avatar_url, is_premium, is_verified,
  first_name, last_name, city, country, cover_template,
  social_instagram, social_tiktok, social_youtube, social_facebook, contact_email,
  created_at
from profiles;
grant select on profiles_public to anon, authenticated;

create or replace view profiles_private as
select id, manifest_line1, manifest_line2, phone
from profiles
where id = auth.uid();
grant select on profiles_private to authenticated;
```

- [ ] **Step 2: Hand off to the human for manual application**

This step cannot be automated in this environment (no CLI auth token, per every prior migration in this project). Tell the human: "Paste `supabase/migrations/20260703130000_ia_redesign_profile_trust_fields.sql` into Supabase Studio's SQL Editor for project `wkqblgefvcvzufbqdbie`." Do not block later tasks on this — later tasks are written to degrade gracefully until it's applied (see Global Constraints).

- [ ] **Step 3: Verify (after human applies it)**

Run in Supabase Studio SQL Editor:
```sql
select column_name from information_schema.columns where table_name = 'profiles' and column_name = 'is_verified';
select count(*) from pg_views where viewname in ('profiles_public', 'profiles_private');
```
Expected: `is_verified` present, both views exist (count = 2).

Then with an anon key:
```bash
curl -s "https://wkqblgefvcvzufbqdbie.supabase.co/rest/v1/profiles?select=manifest_line1" -H "apikey: <anon-key>"
```
Expected: `{"code":"42501", ...permission denied...}` (was `200` before this migration).

---

## Task 2: `requireUsername` — expose `isVerified`

**Files:**
- Modify: `src/lib/requireUsername.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces (used by Tasks 4, 8, 11): `requireUsername(): Promise<{ userId: string; username: string; isPremium: boolean; isVerified: boolean } | null>`.

- [ ] **Step 1: Add `is_verified` to the query and return shape**

```ts
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
```

**Corrected during Task 2's review** (this note replaces an earlier, incorrect version of this task): PostgREST fails an entire `select()` if *any* requested column doesn't exist yet — it does not return the other columns with the missing one blank. The original version of this snippet combined `is_verified` into the same `select("username, is_premium, is_verified")` as `username`, reasoning that a pre-migration failure was "pre-existing behavior, not a new regression, since username would be missing too." That reasoning was wrong: before this task, that query only ever failed for a row genuinely missing a username (rare, expected case); after combining in `is_verified`, the *entire query* fails for *every* user whenever the migration hasn't been applied yet — misrouting every signed-in user to `/setup/username` on every page that calls `requireUsername()`, not a graceful degradation of one feature. `is_verified` is now fetched in its own separate query specifically so its failure can't take down the username check, per this plan's own Global Constraint.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors (existing callers destructure `{ userId, username, isPremium }`, adding a field doesn't break them).

- [ ] **Step 3: Commit**

```bash
git add src/lib/requireUsername.ts
git commit -m "feat: expose isVerified from requireUsername"
```

---

## Task 3: `BottomNav` — icon-only on mobile, home route to `/`

**Files:**
- Modify: `src/components/BottomNav.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no interface change (`Props = { active?: "home"|"jars"|"create"|"profile" }` unchanged).

- [ ] **Step 1: Remove labels, add aria-label, resize icons, fix home href**

In `src/components/BottomNav.tsx`, replace the `navTab` helper and the `Home` call:

```tsx
  const navTab = (href: string, key: Props["active"], icon: React.ReactNode, label: string) => {
    const isActive = active === key;
    return (
      <a href={href} aria-label={label} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
        style={{ color: isActive ? "#3D1A24" : "#9B7E6A" }}>
        {icon}
      </a>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-wj-card border-t border-wj-card-border">
      {navTab("/", "home", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ), "Home")}

      {navTab("/jars", "jars", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="7" y="2" width="10" height="3" rx="1.5"/>
          <rect x="5" y="5" width="14" height="2" rx="1"/>
          <rect x="4" y="7" width="16" height="15" rx="4"/>
        </svg>
      ), "Jars")}

      <a href="/jars/new" className="flex flex-col items-center justify-center flex-1 py-1" aria-label="Create jar">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-3xl font-light leading-none bg-wj-plum">
          +
        </span>
      </a>

      {navTab(`/u/${username}`, "profile", (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ), "Profile")}
    </nav>
  );
```

(Only the `w-6 h-6` → `w-7 h-7` sizes, the removed `<span>` label, the added `aria-label={label}`, and `"/dashboard"` → `"/"` changed — everything else in the file is unchanged.)

- [ ] **Step 2: Type-check and manual check**

Run: `npx tsc --noEmit`. Then in the browser at ≤767px width: confirm all 4 nav items show icon-only (no text), Home icon is visibly larger than before, tapping each icon still navigates (Home will 404 or show old content until Task 4 lands — that's expected mid-plan).

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: icon-only bottom nav, point Home at /"
```

---

## Task 4: Home Timeline — merge into `/`, retire `/dashboard`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard/page.tsx` (becomes a redirect stub)
- Modify: `src/app/settings/manifesto/page.tsx` (own-manifesto read, same fix as Home — see Step 6)

**Interfaces:**
- Consumes: `requireUsername()` (Task 2, for `isVerified` — not used directly on Home but exercises the updated return type), `interleaveByRatio<T>(buckets: T[][], pattern: number[]): T[]` (`src/lib/interleave.ts`, unchanged), `HowItWorksBar` (Task 5), the `profiles_private` view (Task 1).
- Produces: signed-in Home Timeline lives at `/`. `/dashboard` no longer renders content.

This is the largest single task in the plan. Design decision (flag for human review at the approval gate): the brief's three timeline buckets are "followed jars / popular jars / completed jars," scoped to **posts**, not jars. A literal port of `/feed`'s bucket queries (`popular` and `completed` both `.neq("user_id", auth.userId)`) would mean a user's own posts never appear on their own Home — a regression vs. today's flat "all posts" feed. Fix: the "followed" bucket becomes "followed **or owned**" jars, so your own jars' posts keep appearing on your own Home exactly as before; the popular/completed buckets keep excluding your own jars unchanged (matches `/feed`'s existing, already-shipped exclusion logic).

**Important cross-task dependency:** Task 1's migration revokes direct `select` on `manifest_line1`/`manifest_line2` from the `authenticated` role at the base `profiles` table — including for a user reading their *own* row, which is exactly what the pre-existing dashboard code did (`supabase.from("profiles").select("avatar_url, manifest_line1, manifest_line2")`). After the migration is applied, that query would start failing entirely (Postgres denies the whole query if any selected column lacks a grant), silently blanking the manifesto everywhere it's read. Per spec §3/§10, both places that read a user's own manifesto (Home, `/settings/manifesto`) must switch to the `profiles_private` view instead. This task's Step 1 already does this for Home; Step 6 does the same for `/settings/manifesto`.

- [ ] **Step 1: Rewrite `src/app/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import { interleaveByRatio } from "@/lib/interleave";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import HomeHeroCard from "@/components/HomeHeroCard";
import HowItWorksBar from "@/components/HowItWorksBar";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import JarIllustration from "@/components/JarIllustration";

type Jar = { id: string; title: string };
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; avatarUrl: string | null; jar_title: string | null;
};

export default function RootPage() {
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [manifestLine1, setManifestLine1] = useState<string | null>(null);
  const [manifestLine2, setManifestLine2] = useState<string | null>(null);
  const [myJars, setMyJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setCheckedAuth(true); return; }
      setSignedIn(true);

      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      setUsername(auth.username);

      const [{ data: profile }, { data: manifest }, { data: myJarsData }, { data: followRows }, { data: unreadNotifications }] = await Promise.all([
        supabase.from("profiles").select("avatar_url").eq("id", auth.userId).single(),
        supabase.from("profiles_private").select("manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("jar_follows").select("jar_id").eq("user_id", auth.userId),
        supabase.from("notifications").select("id").eq("recipient_id", auth.userId).is("read_at", null).limit(1),
      ]);

      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(manifest?.manifest_line1 ?? null);
      setManifestLine2(manifest?.manifest_line2 ?? null);
      setMyJars(myJarsData ?? []);
      setHasUnreadNotifications((unreadNotifications ?? []).length > 0);

      const ownJarIds = (myJarsData ?? []).map((j) => j.id);
      const followedJarIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedOrOwnIds = [...new Set([...ownJarIds, ...followedJarIds])];
      const followedSet = new Set(followedJarIds);

      const jarColumns = "id, follower_count";
      const [{ data: followedOrOwnJars }, { data: popularJars }, { data: completedJars }] = await Promise.all([
        followedOrOwnIds.length > 0
          ? supabase.from("jars").select(jarColumns).in("id", followedOrOwnIds).eq("status", "active")
          : Promise.resolve({ data: [] as { id: string; follower_count: number }[] }),
        supabase.from("jars").select(jarColumns).eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(jarColumns).eq("status", "completed").neq("user_id", auth.userId)
          .order("created_at", { ascending: false }).limit(20),
      ]);

      const followedOrOwnIdSet = new Set((followedOrOwnJars ?? []).map((j) => j.id));
      const popularIds = (popularJars ?? [])
        .filter((j) => !followedOrOwnIdSet.has(j.id) && !followedSet.has(j.id))
        .map((j) => j.id);
      const completedIds = (completedJars ?? []).map((j) => j.id);

      const [{ data: followedPosts }, { data: popularPosts }, { data: completedPosts }] = await Promise.all([
        followedOrOwnIdSet.size > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", [...followedOrOwnIdSet]).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
        popularIds.length > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", popularIds).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
        completedIds.length > 0
          ? supabase.from("posts").select("id, user_id, jar_id, content, created_at").in("jar_id", completedIds).order("created_at", { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
      ]);

      const rawPosts = interleaveByRatio(
        [followedPosts ?? [], popularPosts ?? [], completedPosts ?? []],
        [0, 1, 0, 1, 2]
      );

      if (rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds = [...new Set(rawPosts.map((p) => p.jar_id).filter(Boolean))] as string[];
        const [{ data: profiles }, { data: jarsForPosts }] = await Promise.all([
          supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
          jarIds.length > 0 ? supabase.from("jars").select("id, title").in("id", jarIds) : Promise.resolve({ data: [] }),
        ]);
        const pMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, { username: p.username as string, avatarUrl: (p.avatar_url ?? null) as string | null }])
        );
        const jMap = Object.fromEntries((jarsForPosts ?? []).map((j) => [j.id, j.title as string]));
        setPosts(rawPosts.map((p) => ({
          ...p,
          username: pMap[p.user_id]?.username ?? "unknown",
          avatarUrl: pMap[p.user_id]?.avatarUrl ?? null,
          jar_title: p.jar_id ? (jMap[p.jar_id] ?? null) : null,
        })));
      }
      setLoading(false);
      setCheckedAuth(true);
    };
    load();
  }, []);

  const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
    setPosts((prev) => [
      { ...post, user_id: userId ?? "", username: username ?? "you", avatarUrl },
      ...prev,
    ]);
  };

  if (!checkedAuth) {
    return <div className="min-h-screen bg-wj-cream" />;
  }

  if (!signedIn) {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader activeTab="home" />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />

      <HomeHeroCard
        userId={userId!}
        username={username ?? "there"}
        avatarUrl={avatarUrl}
        manifestLine1={manifestLine1}
        manifestLine2={manifestLine2}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      <div className="px-4 md:mx-auto md:max-w-5xl space-y-3">
        <HowItWorksBar />
        <PostComposer userId={userId!} jars={myJars} onPosted={handlePosted} />

        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              username={post.username}
              avatarUrl={post.avatarUrl}
              createdAt={post.created_at}
              content={post.content}
              jarId={post.jar_id}
              jarTitle={post.jar_title}
            />
          ))
        )}
      </div>

      <footer className="hidden md:block mt-10 border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-wj-muted">
          <span>© 2026 WishJar · Created by <strong className="text-wj-text">Selçuk Kıvrak</strong> · Built with AI</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-wj-text">Privacy</a>
            <a href="/terms" className="hover:text-wj-text">Terms</a>
          </div>
        </div>
      </footer>

      <BottomNav active="home" />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-wj-cream text-wj-text">
      <header style={{ background: "#3D1A24", borderBottom: "1px solid #6B2D40" }}>
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 80 80" className="h-8 w-8" aria-hidden="true">
              <rect x="22" y="8" width="36" height="10" rx="3" fill="#EDD98A" />
              <rect x="16" y="20" width="48" height="52" rx="8" fill="#EDD98A" opacity="0.2" />
              <rect x="16" y="20" width="48" height="52" rx="8" fill="none" stroke="#EDD98A" strokeWidth="2" />
              <path d="M40 32L43 38.5L50 39.5L45 44.5L46.5 52L40 48.5L33.5 52L35 44.5L30 39.5L37 38.5Z" fill="#EDD98A" />
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </div>
          <nav className="flex items-center gap-2">
            <a href="/login" className="px-3 py-1.5 text-sm text-white/80 hover:text-white">Sign in</a>
            <a href="/signup" className="rounded-xl px-4 py-1.5 text-sm font-bold text-wj-plum hover:opacity-80" style={{ background: "#EDD98A" }}>
              Join free
            </a>
          </nav>
        </div>
      </header>

      <div className="border-b border-wj-card-border bg-wj-card">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-snug text-wj-text">
                Your wishes, collected.<br />Your community, connected.
              </h1>
              <p className="mb-6 text-sm leading-6 text-wj-muted">
                Build a wishlist for any goal. Share it with people who care.
              </p>
              <div className="flex items-center gap-3">
                <a href="/signup" className="rounded-2xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
                  Create your first jar
                </a>
                <a href="/login" className="rounded-2xl border border-wj-card-border px-5 py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream">
                  Sign in
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-wj-gold-card overflow-hidden" style={{ background: "#F0D080", boxShadow: "var(--wj-shadow)" }}>
              <div className="flex items-center gap-3 px-4 py-4">
                <JarIllustration variant="partial" size={70} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-wj-text">New Home Jar</span>
                    <span className="rounded-full bg-wj-cream px-2 py-0.5 text-xs text-wj-muted">New Home</span>
                  </div>
                  <div className="h-2 rounded-full bg-wj-cream">
                    <div className="h-2 w-2/5 rounded-full bg-wj-gold" />
                  </div>
                  <p className="mt-1 text-xs text-wj-muted">$1,250 planned of $3,000 goal</p>
                </div>
              </div>
              <div className="border-t border-wj-gold-card divide-y divide-wj-gold-card" style={{ background: "#FDFAF3" }}>
                {[
                  { name: "Sofa", price: "$420" },
                  { name: "Coffee machine", price: "$180" },
                  { name: "Kitchen set", price: "$650" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-wj-text">{item.name}</span>
                    <span className="text-sm font-bold text-wj-text">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-lg font-bold text-wj-text">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "1", title: "Create", desc: "Start a jar for any goal — a home, a wedding, a trip." },
            { step: "2", title: "Add wishes", desc: "Add items with prices and links. Set a target." },
            { step: "3", title: "Share", desc: "Send your jar link to friends. Let them support you." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl bg-wj-card border border-wj-card-border p-5 text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
              <div className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white bg-wj-plum">
                {item.step}
              </div>
              <h3 className="font-bold text-wj-text mb-2">{item.title}</h3>
              <p className="text-xs text-wj-muted leading-5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <h2 className="mb-5 text-base font-semibold text-wj-text">Categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {["New Home", "Wedding", "Baby", "Travel", "Education", "Birthday", "Gaming", "Startup", "Charity", "Other"].map((cat) => (
            <div key={cat} className="rounded-2xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-center text-sm text-wj-text" style={{ boxShadow: "var(--wj-shadow)" }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-wj-card-border" style={{ background: "#3D1A24" }}>
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to start?</h2>
          <p className="text-sm text-white/70 mb-6">Free. No card needed.</p>
          <a href="/signup" className="inline-block rounded-2xl px-8 py-3 text-sm font-bold text-wj-plum hover:opacity-80" style={{ background: "#EDD98A" }}>
            Get started
          </a>
        </div>
      </div>

      <footer className="border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col items-center gap-1 text-xs text-wj-muted md:flex-row md:justify-between">
            <span>© 2026 WishJar · Created by <strong className="text-wj-text">Selçuk Kıvrak</strong> · Built with AI</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-wj-text">Privacy</a>
              <a href="/terms" className="hover:text-wj-text">Terms</a>
              <a href="mailto:slckkvrk@gmail.com" className="hover:text-wj-text">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Turn `/dashboard` into a redirect stub**

Replace all of `src/app/dashboard/page.tsx` with:

```tsx
"use client";

import { useEffect } from "react";

export default function DashboardRedirect() {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return <div className="min-h-screen bg-wj-cream" />;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual browser check**

Signed-out: visiting `/` shows the old landing page unchanged. Signed-in: visiting `/` shows hero + composer + timeline (posts may be empty/sparse until Task 6 seeds discovery and until real cross-account data exists — that's expected). Visiting `/dashboard` bounces to `/`. Your own posts on your own jars still show up on your own Home.

- [ ] **Step 5: Apply the same `profiles_private` fix to `/settings/manifesto`**

In `src/app/settings/manifesto/page.tsx`, replace the load query:

```tsx
      const { data: profile } = await supabase
        .from("profiles").select("manifest_line1, manifest_line2").eq("id", auth.userId).single();
      setLine1(profile?.manifest_line1 ?? "");
      setLine2(profile?.manifest_line2 ?? "");
```

with:

```tsx
      const { data: profile } = await supabase
        .from("profiles_private").select("manifest_line1, manifest_line2").eq("id", auth.userId).single();
      setLine1(profile?.manifest_line1 ?? "");
      setLine2(profile?.manifest_line2 ?? "");
```

The save handler (`supabase.from("profiles").update({ manifest_line1, manifest_line2 })`) is unchanged — Task 1 only revokes `SELECT` on these columns, not `UPDATE`, so writing directly to the base table still works.

- [ ] **Step 6: Type-check and manual check for the manifesto fix**

Run: `npx tsc --noEmit`. In the browser: `/settings/manifesto` still loads and prefills your existing lines 1/2 correctly, saving still works. Before Task 1's migration is applied, this page shows blank fields instead of erroring (Postgrest 400 on a nonexistent view → `profile` is `undefined` → `?? ""` fallback), and does not crash.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/dashboard/page.tsx src/app/settings/manifesto/page.tsx
git commit -m "feat: move signed-in Home timeline to /, retire /dashboard, read manifesto via profiles_private"
```

---

## Task 5: `HowItWorksBar` — dismissible strip

**Files:**
- Create: `src/components/HowItWorksBar.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Task 4): `<HowItWorksBar />`, no props.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wj_how_it_works_dismissed";

export default function HowItWorksBar() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-wj-card-border bg-wj-card px-3 py-2 text-xs text-wj-muted">
      <span className="truncate">🫙 Create a jar · ⭐ Add wishes to it · 📢 Share updates with your followers</span>
      <button onClick={handleDismiss} aria-label="Dismiss" className="shrink-0 text-wj-muted hover:text-wj-text">✕</button>
    </div>
  );
}
```

Note: defaults to `dismissed = true` on first render (before the `useEffect` reads `localStorage`) so there's no server/client mismatch flash of a bar that's about to disappear — it briefly shows nothing, then appears if not previously dismissed. This is the opposite tradeoff from the spec's "flash of visible bar" note but is strictly better UX (flash-of-nothing beats flash-of-then-remove).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual browser check**

First visit to `/`: bar appears below the hero. Click ✕: bar disappears immediately and stays gone after a page refresh.

- [ ] **Step 4: Commit**

```bash
git add src/components/HowItWorksBar.tsx
git commit -m "feat: add dismissible HowItWorksBar to Home"
```

---

## Task 6: Jars page — convert to discovery, retire `/feed`

**Files:**
- Modify: `src/app/jars/page.tsx`
- Modify: `src/app/feed/page.tsx` (becomes a redirect stub)

**Interfaces:**
- Consumes: `interleaveByRatio` (unchanged), `JarCard` (Task 9's expanded props — pass `followerCount` unconditionally).
- Produces: `/jars` shows discovery content (followed + popular + completed jars, own jars excluded). `/feed` no longer renders content.

- [ ] **Step 1: Rewrite `src/app/jars/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import BottomNav from "@/components/BottomNav";
import { interleaveByRatio } from "@/lib/interleave";

type DiscoverJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string; follower_count: number;
  completed_at?: string | null;
};

export default function JarsPage() {
  const [jars, setJars] = useState<DiscoverJar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setCurrentUserId(auth.userId);

      const { data: followRows } = await supabase
        .from("jar_follows").select("jar_id").eq("user_id", auth.userId);
      const followedJarIds = (followRows ?? []).map((r) => r.jar_id as string);
      const followedSet = new Set(followedJarIds);
      setFollowedIds(followedSet);

      const jarColumns = "id, title, description, category, goal_amount, user_id, follower_count, status";

      const [{ data: followedJarsRaw }, { data: popularJarsRaw }, { data: completedJarsRaw }] = await Promise.all([
        followedJarIds.length > 0
          ? supabase.from("jars").select(jarColumns).in("id", followedJarIds).eq("status", "active").order("created_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        supabase.from("jars").select(jarColumns).eq("status", "active").neq("user_id", auth.userId)
          .order("follower_count", { ascending: false }).limit(20),
        supabase.from("jars").select(`${jarColumns}, completed_at`).eq("status", "completed").neq("user_id", auth.userId)
          .order("completed_at", { ascending: false }).limit(20),
      ]);

      const allRaw = [
        ...(followedJarsRaw ?? []), ...(popularJarsRaw ?? []), ...(completedJarsRaw ?? []),
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
      (wishData ?? []).forEach((w) => { valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0); });
      setWishValueMap(valueMap);

      const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));
      const toDiscoverJar = (j: (typeof allRaw)[number]): DiscoverJar => ({
        id: j.id, title: j.title, description: j.description ?? null,
        category: j.category, goal_amount: j.goal_amount, status: j.status,
        username: profileMap[j.user_id] ?? "?", follower_count: j.follower_count ?? 0,
        completed_at: j.completed_at ?? null,
      });

      const followedBucket = (followedJarsRaw ?? []).map((j) => toDiscoverJar(j as (typeof allRaw)[number]));
      const popularBucket = (popularJarsRaw ?? [])
        .filter((j) => !followedSet.has(j.id))
        .map((j) => toDiscoverJar(j as (typeof allRaw)[number]));
      const completedBucket = (completedJarsRaw ?? []).map((j) => toDiscoverJar(j as (typeof allRaw)[number]));

      setJars(interleaveByRatio([followedBucket, popularBucket, completedBucket], [0, 1, 0, 1, 2]));
      setLoading(false);
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

      <div className="md:hidden px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-wj-text">Discover Jars</h1>
        <p className="text-xs text-wj-muted mt-0.5">Followed, popular, and completed jars</p>
      </div>

      <div className="px-4 md:mx-auto md:max-w-5xl md:py-6">
        <div className="hidden md:block mb-5">
          <h1 className="text-xl font-bold text-wj-text">Discover Jars</h1>
          <p className="text-sm text-wj-muted mt-0.5">Followed, popular, and completed jars</p>
        </div>

        {jars.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-wj-muted">No jars to discover yet. Follow some jars to see updates here.</p>
          </div>
        ) : (
          jars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={jar}
              totalWishValue={wishValueMap[jar.id] ?? 0}
              followerCount={jar.follower_count}
              isFollowing={followedIds.has(jar.id)}
              currentUserId={currentUserId ?? undefined}
            />
          ))
        )}
      </div>

      <BottomNav active="jars" />
    </div>
  );
}
```

Note: this deliberately drops `/feed`'s desktop "Trending Jars" sidebar and the `MAX_JARS`/"My Jars" header — those belonged to the old "my jars" and "community feed" pages respectively; discovery is single-column on both breakpoints, matching the spec's §8 description. The "Community Posts" section is also dropped — posts now live on Home (Task 4).

- [ ] **Step 2: Turn `/feed` into a redirect stub**

Replace all of `src/app/feed/page.tsx` with:

```tsx
"use client";

import { useEffect } from "react";

export default function FeedRedirect() {
  useEffect(() => {
    window.location.href = "/jars";
  }, []);
  return <div className="min-h-screen bg-wj-cream" />;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual browser check**

`/jars` shows discovery content, not "my own jars." Your own jars do not appear. Visiting `/feed` bounces to `/jars`.

- [ ] **Step 5: Commit**

```bash
git add src/app/jars/page.tsx src/app/feed/page.tsx
git commit -m "feat: convert /jars to discovery page, retire /feed"
```

---

## Task 7: `PostComposer` — mandatory jar, block when no jars

**Files:**
- Modify: `src/components/PostComposer.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no prop signature change (`{ userId, jars, onPosted }` unchanged) — behavior only.

- [ ] **Step 1: Require a jar, block the composer when `jars.length === 0`**

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeText } from "@/lib/validate";

type Jar = { id: string; title: string };
type PostedPost = { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string };

type Props = {
  userId: string;
  jars: Jar[];
  onPosted: (post: PostedPost) => void;
};

export default function PostComposer({ userId, jars, onPosted }: Props) {
  const [content, setContent] = useState("");
  const [jarId, setJarId] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  if (jars.length === 0) {
    return (
      <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
        <p className="text-sm text-wj-muted mb-2">You need a jar to post yet. Create one first.</p>
        <a href="/jars/new" className="text-sm font-semibold text-wj-plum hover:underline">Create a jar →</a>
      </div>
    );
  }

  const handlePost = async () => {
    const cleaned = sanitizeText(content, 500);
    if (!cleaned || !jarId) return;
    setPosting(true);
    setError("");
    const { data: inserted, error: err } = await supabase
      .from("posts")
      .insert({ user_id: userId, content: cleaned, jar_id: jarId })
      .select("id, content, jar_id, created_at")
      .single();
    setPosting(false);
    if (err || !inserted) {
      setError(err?.message ?? "Could not post. Please try again.");
      return;
    }
    const jarTitle = jars.find((j) => j.id === jarId)?.title ?? null;
    onPosted({ ...inserted, jar_title: jarTitle });
    setContent("");
    setJarId("");
  };

  return (
    <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
      <h2 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">New Post</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2 text-sm outline-none focus:border-wj-plum text-wj-text"
      />
      <div className="flex items-center gap-2 mt-2">
        <select
          value={jarId}
          onChange={(e) => setJarId(e.target.value)}
          className="flex-1 rounded-xl border border-wj-card-border bg-wj-card px-3 py-1.5 text-xs outline-none text-wj-text"
        >
          <option value="">Which jar is this about?</option>
          {jars.map((j) => <option key={j.id} value={j.id}>🫙 {j.title}</option>)}
        </select>
        <button
          onClick={handlePost}
          disabled={posting || !content.trim() || !jarId}
          className="rounded-xl bg-wj-plum px-4 py-1.5 text-xs font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual browser check**

A user with zero jars sees the "create a jar first" card instead of the composer, on both Home and their own Profile page. A user with jars sees the dropdown default to "Which jar is this about?" and cannot click Post until a jar is chosen.

- [ ] **Step 4: Commit**

```bash
git add src/components/PostComposer.tsx
git commit -m "feat: require a jar to post, block composer with zero jars"
```

---

## Task 8: `VerificationGate` + `/jars/new` gate

**Files:**
- Create: `src/components/VerificationGate.tsx`
- Modify: `src/app/jars/new/page.tsx`

**Interfaces:**
- Consumes: `requireUsername()`'s `isVerified` (Task 2).
- Produces: `<VerificationGate missingFields={string[]} />`.

- [ ] **Step 1: Write `VerificationGate.tsx`**

```tsx
type Props = { missingFields: string[] };

export default function VerificationGate({ missingFields }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="rounded-2xl bg-wj-card border border-wj-card-border p-6 text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-base font-bold text-wj-text mb-2">Verify your account to create a jar.</h1>
        {missingFields.length > 0 && (
          <p className="text-sm text-wj-muted mb-5">
            Missing: {missingFields.join(", ")}.
          </p>
        )}
        <a href="/settings/profile" className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
          Complete your profile
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the gate into `/jars/new`**

In `src/app/jars/new/page.tsx`, add the verification check (mirrors the existing `atLimit` pattern). Add state and the check in the effect:

```tsx
import VerificationGate from "@/components/VerificationGate";

// ...inside NewJarPage, add:
const [isVerified, setIsVerified] = useState(true);
const [missingFields, setMissingFields] = useState<string[]>([]);
```

Modify the existing `useEffect`'s `check` function — replace:

```tsx
    const check = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      if (auth.isPremium) { setLoading(false); return; }

      const { count } = await supabase
        .from("jars")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "active");

      if ((count ?? 0) >= MAX_JARS) setAtLimit(true);
      setLoading(false);
    };
```

with:

```tsx
    const check = async () => {
      const auth = await requireUsername();
      if (!auth) return;

      if (!auth.isVerified) {
        const { data: profile } = await supabase
          .from("profiles").select("first_name, last_name, city, country, phone").eq("id", auth.userId).single();
        const missing: string[] = [];
        if (!(profile?.first_name ?? "").trim()) missing.push("first name");
        if (!(profile?.last_name ?? "").trim()) missing.push("last name");
        if (!(profile?.city ?? "").trim()) missing.push("city");
        if (!(profile?.country ?? "").trim()) missing.push("country");
        if (!(profile?.phone ?? "").trim()) missing.push("phone");
        setMissingFields(missing);
        setIsVerified(false);
        setLoading(false);
        return;
      }

      if (auth.isPremium) { setLoading(false); return; }

      const { count } = await supabase
        .from("jars")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "active");

      if ((count ?? 0) >= MAX_JARS) setAtLimit(true);
      setLoading(false);
    };
```

Then add the gate render, right after the existing `if (loading) return (...)` block and before the existing `if (atLimit) return (...)` block:

```tsx
  if (!isVerified) return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <VerificationGate missingFields={missingFields} />
      <BottomNav active="create" />
    </div>
  );
```

Note on the degrade-gracefully constraint: if the migration from Task 1 isn't applied yet, `requireUsername()`'s `is_verified` select fails, `profile` is `undefined`, `?? false` makes `auth.isVerified` false for everyone — meaning jar creation is gated closed (not open) during the gap. This is the safe direction to fail in (blocks creation rather than silently allowing unverified users through), consistent with "gate defaults closed" being the only safe default for an auth check.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual browser check**

An account with no name/city/country/phone filled in sees "Verify your account to create a jar." with a list of missing fields and a link to `/settings/profile`, form is not rendered. After filling in all 5 fields (Task 10) and re-visiting `/jars/new`, the form renders normally.

- [ ] **Step 5: Commit**

```bash
git add src/components/VerificationGate.tsx src/app/jars/new/page.tsx
git commit -m "feat: gate jar creation behind account verification"
```

---

## Task 9: `JarCard` — creator tag, verified badge, mandatory supporter count

**Files:**
- Modify: `src/components/JarCard.tsx`

**Interfaces:**
- Consumes: nothing new from other tasks, but now expects `jar.isVerified` and always expects `followerCount` to be passed (both discovery call sites — Task 6's `/jars`, and `/feed`'s deprecated equivalent — already pass it).
- Produces: `JarCardProps["jar"]` gains `isVerified?: boolean`. `followerCount` stays optional in the type (for the one remaining caller that doesn't have it, if any) but is always passed by both live call sites after Task 6.

- [ ] **Step 1: Add `isVerified` to the type, add the "by @" format and badge**

In `src/components/JarCard.tsx`, change the type and the label row:

```tsx
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
```

Replace the username line inside the "Main content row":

```tsx
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
```

(This removes the old `{followerCount !== undefined && (...)}` conditional — the supporter count is now always shown, defaulting to 0 rather than being hidden, matching the brief's "creator etiketi isteğe bağlı değildir" rule extended to the supporter count. **Uses the existing local `count` state, not the `followerCount` prop directly** — the component already tracks follows optimistically via `const [count, setCount] = useState(followerCount ?? 0)` and bumps `count` on follow/unfollow (`onToggle={(next) => { setFollowing(next); setCount((c) => c + (next ? 1 : -1)); }}`, unchanged elsewhere in the file). Reading `followerCount` directly here instead of `count` would silently break that optimistic update — the number would stop moving when a user follows/unfollows until the next full reload.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (call sites that don't pass `followerCount` now render "0 supporters" instead of omitting the line — acceptable, matches the "always shown" requirement; call sites that don't pass `jar.isVerified` simply don't render the ✓, which is correct until Task 1's migration is applied and `profiles_public.is_verified` is wired into jar list queries in a follow-up — **not part of this plan**, since no current call site selects owner verification status. Flag as a known gap for the next round, not a blocker here since `is_verified` badge display is additive and non-breaking either way.)

- [ ] **Step 3: Manual browser check**

Any `JarCard` (Discover page, jar detail's related-jars if present) shows "by @username" and a supporter count, even when zero.

- [ ] **Step 4: Commit**

```bash
git add src/components/JarCard.tsx
git commit -m "feat: always show creator tag and supporter count on JarCard"
```

---

## Task 10: `CoverPicker` + `ProfileHeader` + `/settings/profile` trust fields

**Files:**
- Create: `src/lib/coverTemplates.ts`
- Create: `src/components/CoverPicker.tsx`
- Create: `src/components/ProfileHeader.tsx`
- Modify: `src/app/settings/profile/page.tsx`

**Interfaces:**
- Produces (used by Task 11): `coverBackground(template: string | null): string`; `<CoverPicker value={string | null} onChange={(id: string) => void} />`; `<ProfileHeader profile={ProfileHeaderData} isOwn={boolean} />` where `ProfileHeaderData` includes all new trust fields.

- [ ] **Step 1: Write `src/lib/coverTemplates.ts`**

```ts
export const COVER_TEMPLATES: Record<string, string> = {
  "1": "linear-gradient(135deg, #3D1A24, #6B2D40)",
  "2": "linear-gradient(135deg, #C9973A, #F0D080)",
  "3": "linear-gradient(135deg, #EDE6FB, #F7F1FC)",
  "4": "#F5EDD5",
  "5": "linear-gradient(135deg, #3D1A24, #C9973A)",
  "6": "#FDFAF3",
};

export const DEFAULT_COVER_TEMPLATE = "3";

export function coverBackground(template: string | null | undefined): string {
  return COVER_TEMPLATES[template ?? DEFAULT_COVER_TEMPLATE] ?? COVER_TEMPLATES[DEFAULT_COVER_TEMPLATE];
}
```

- [ ] **Step 2: Write `src/components/CoverPicker.tsx`**

```tsx
import { COVER_TEMPLATES } from "@/lib/coverTemplates";

type Props = { value: string | null; onChange: (id: string) => void };

export default function CoverPicker({ value, onChange }: Props) {
  const selected = value ?? "3";
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(COVER_TEMPLATES).map(([id, background]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-label={`Cover template ${id}`}
          className="h-14 rounded-xl border-2 transition-colors"
          style={{ background, borderColor: selected === id ? "#3D1A24" : "transparent" }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ProfileHeader.tsx`**

```tsx
import { Instagram, Youtube, Facebook, Music2, Mail, MapPin, BadgeCheck } from "lucide-react";
import AvatarCircle from "./AvatarCircle";
import { coverBackground } from "@/lib/coverTemplates";

export type ProfileHeaderData = {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  country: string | null;
  isVerified: boolean;
  coverTemplate: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialYoutube: string | null;
  socialFacebook: string | null;
  contactEmail: string | null;
};

type Props = { profile: ProfileHeaderData };

export default function ProfileHeader({ profile }: Props) {
  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : `@${profile.username}`;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div>
      <div className="h-24 rounded-t-2xl" style={{ background: coverBackground(profile.coverTemplate) }} />
      <div className="px-4 -mt-8">
        <div className="rounded-full border-4 border-wj-cream inline-block">
          <AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatarUrl} />
        </div>
      </div>
      <div className="px-4 pt-2">
        <h1 className="text-lg font-bold text-wj-text flex items-center gap-1.5">
          {displayName}
          {profile.isVerified && <BadgeCheck size={16} className="text-wj-plum" aria-label="Verified account" />}
        </h1>
        <p className="text-xs text-wj-muted">@{profile.username}</p>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-wj-muted">
            <MapPin size={12} /> {location}
          </p>
        )}
        {profile.bio && <p className="mt-1.5 text-xs text-wj-text">{profile.bio}</p>}
        {(profile.contactEmail || profile.socialInstagram || profile.socialTiktok || profile.socialYoutube || profile.socialFacebook) && (
          <div className="mt-2 flex items-center gap-3 text-wj-muted">
            {profile.contactEmail && (
              <a href={`mailto:${profile.contactEmail}`} aria-label="Contact" className="hover:text-wj-plum"><Mail size={16} /></a>
            )}
            {profile.socialInstagram && (
              <a href={profile.socialInstagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-wj-plum"><Instagram size={16} /></a>
            )}
            {profile.socialTiktok && (
              <a href={profile.socialTiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-wj-plum"><Music2 size={16} /></a>
            )}
            {profile.socialYoutube && (
              <a href={profile.socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-wj-plum"><Youtube size={16} /></a>
            )}
            {profile.socialFacebook && (
              <a href={profile.socialFacebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-wj-plum"><Facebook size={16} /></a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add trust fields + cover picker to `/settings/profile`**

In `src/app/settings/profile/page.tsx`, add state and load/save logic for the new fields. Add imports and state:

```tsx
import CoverPicker from "@/components/CoverPicker";
import { isValidUrl } from "@/lib/validate";

// add alongside existing state:
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [city, setCity] = useState("");
const [country, setCountry] = useState("");
const [phone, setPhone] = useState("");
const [coverTemplate, setCoverTemplate] = useState<string | null>(null);
const [socialInstagram, setSocialInstagram] = useState("");
const [socialTiktok, setSocialTiktok] = useState("");
const [socialYoutube, setSocialYoutube] = useState("");
const [socialFacebook, setSocialFacebook] = useState("");
const [contactEmail, setContactEmail] = useState("");
```

Per the Global Constraint on graceful degradation, fetch these in a **separate** query from the existing `username, bio` load (so a pre-migration 400 only blanks the new fields, not the whole page). Replace the existing load effect body:

```tsx
  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      const { data: profile } = await supabase
        .from("profiles").select("username, bio").eq("id", auth.userId).single();
      if (profile) {
        setUsername(profile.username ?? "");
        setSavedUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
      }
      const { data: trustFields } = await supabase
        .from("profiles")
        .select("first_name, last_name, city, country, phone, cover_template, social_instagram, social_tiktok, social_youtube, social_facebook, contact_email")
        .eq("id", auth.userId)
        .single();
      if (trustFields) {
        setFirstName(trustFields.first_name ?? "");
        setLastName(trustFields.last_name ?? "");
        setCity(trustFields.city ?? "");
        setCountry(trustFields.country ?? "");
        setPhone(trustFields.phone ?? "");
        setCoverTemplate(trustFields.cover_template ?? null);
        setSocialInstagram(trustFields.social_instagram ?? "");
        setSocialTiktok(trustFields.social_tiktok ?? "");
        setSocialYoutube(trustFields.social_youtube ?? "");
        setSocialFacebook(trustFields.social_facebook ?? "");
        setContactEmail(trustFields.contact_email ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);
```

Add a second save handler (kept separate from `handleSave`'s username/bio logic — different validation, different section of the form):

```tsx
  const [trustMessage, setTrustMessage] = useState("");
  const [trustSuccess, setTrustSuccess] = useState(false);
  const [savingTrust, setSavingTrust] = useState(false);

  const handleSaveTrustFields = async () => {
    if (!userId) return;
    for (const [label, value] of [["Instagram", socialInstagram], ["TikTok", socialTiktok], ["YouTube", socialYoutube], ["Facebook", socialFacebook]] as const) {
      if (value && !isValidUrl(value)) { setTrustMessage(`${label} must be a valid URL.`); return; }
    }
    setSavingTrust(true);
    setTrustMessage("");
    setTrustSuccess(false);
    const { error: updateErr } = await supabase.from("profiles").update({
      first_name: sanitizeText(firstName, 60) || null,
      last_name: sanitizeText(lastName, 60) || null,
      city: sanitizeText(city, 60) || null,
      country: sanitizeText(country, 60) || null,
      phone: sanitizeText(phone, 30) || null,
      cover_template: coverTemplate,
      social_instagram: sanitizeText(socialInstagram, 200) || null,
      social_tiktok: sanitizeText(socialTiktok, 200) || null,
      social_youtube: sanitizeText(socialYoutube, 200) || null,
      social_facebook: sanitizeText(socialFacebook, 200) || null,
      contact_email: sanitizeText(contactEmail, 120) || null,
    }).eq("id", userId);
    setSavingTrust(false);
    if (updateErr) { setTrustMessage(`Error: ${updateErr.message}`); return; }
    setTrustSuccess(true);
  };
```

Add the form section in the JSX, right after the existing bio `<div>` block and before the `{message && ...}` block:

```tsx
          <div className="border-t border-wj-card-border pt-4">
            <h2 className="text-sm font-bold text-wj-text mb-1">Profile details</h2>
            <p className="text-xs text-wj-muted mb-3">All 5 fields below are required to verify your account and create jars.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={60} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={60} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact email <span className="text-wj-muted font-normal">(optional, shown on your profile)</span></label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={120} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cover template</label>
            <CoverPicker value={coverTemplate} onChange={setCoverTemplate} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Instagram URL <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TikTok URL <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>YouTube URL <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Facebook URL <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} className={inputCls} />
            </div>
          </div>
          {trustMessage && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{trustMessage}</p>}
          {trustSuccess && <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">Saved!</p>}
          <button
            onClick={handleSaveTrustFields}
            disabled={savingTrust}
            className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
          >
            {savingTrust ? "Saving…" : "Save profile details"}
          </button>
```

- [ ] **Step 5: Also fix the fallback link on this page (part of the link sweep, called out here since it's in a file already being touched)**

```tsx
          <a href={savedUsername ? `/u/${savedUsername}` : "/"} className="text-wj-plum hover:underline">
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual browser check**

Before migration applied: page loads, username/bio section works as before, new fields section is present but blank (no crash). After migration applied: filling all 5 required fields + saving, then visiting `/jars/new`, shows the real form instead of `VerificationGate`. Emptying `city` and saving, then re-checking `/jars/new`, shows the gate again.

- [ ] **Step 8: Commit**

```bash
git add src/lib/coverTemplates.ts src/components/CoverPicker.tsx src/components/ProfileHeader.tsx src/app/settings/profile/page.tsx
git commit -m "feat: add profile trust fields (name, location, contact, socials, cover) to settings"
```

---

## Task 11: Wire `ProfileHeader` into `/u/[username]`, fix tab label

**Files:**
- Modify: `src/app/u/[username]/page.tsx`

**Interfaces:**
- Consumes: `ProfileHeader` (Task 10).

- [ ] **Step 1: Fetch new fields separately, replace the two duplicated header blocks**

Change the `Profile` type and add a second state slot:

```tsx
type Profile = { id: string; username: string; bio: string | null; created_at: string; is_premium: boolean; avatar_url: string | null; };
type TrustFields = {
  first_name: string | null; last_name: string | null; city: string | null; country: string | null;
  is_verified: boolean; cover_template: string | null;
  social_instagram: string | null; social_tiktok: string | null; social_youtube: string | null; social_facebook: string | null;
  contact_email: string | null;
};
```

Add `const [trustFields, setTrustFields] = useState<TrustFields | null>(null);` alongside the existing `profile` state, and fetch it as a **separate** query (per the Global Constraint) right after the existing `profileData` fetch:

```tsx
      const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at, is_premium, avatar_url").eq("username", username).single();
      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);

      const { data: trust } = await supabase
        .from("profiles")
        .select("first_name, last_name, city, country, is_verified, cover_template, social_instagram, social_tiktok, social_youtube, social_facebook, contact_email")
        .eq("id", profileData.id)
        .single();
      setTrustFields(trust ?? null);
```

Replace both the mobile header block (the `<div className="md:hidden" ...>` wrapper's inner avatar+name section) and the desktop header block (`<div className="hidden md:block rounded-2xl ...">`'s inner avatar+name section) with a single shared `ProfileHeader` call. Concretely, replace this mobile block:

```tsx
          <div className="flex items-center gap-3 mb-3">
            <AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatar_url} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-wj-text">
                @{profile.username}
                {profile.is_premium && <span title="Premium account" className="ml-1.5 text-wj-gold">★</span>}
              </h1>
              {profile.bio && <p className="text-xs text-wj-muted mt-0.5">{profile.bio}</p>}
              <p className="text-xs text-wj-muted mt-1">
                {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isOwn && (
              <div className="flex items-center gap-2 shrink-0">
```

with:

```tsx
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <ProfileHeader profile={{
                username: profile.username, bio: profile.bio, avatarUrl: profile.avatar_url,
                firstName: trustFields?.first_name ?? null, lastName: trustFields?.last_name ?? null,
                city: trustFields?.city ?? null, country: trustFields?.country ?? null,
                isVerified: trustFields?.is_verified ?? false, coverTemplate: trustFields?.cover_template ?? null,
                socialInstagram: trustFields?.social_instagram ?? null, socialTiktok: trustFields?.social_tiktok ?? null,
                socialYoutube: trustFields?.social_youtube ?? null, socialFacebook: trustFields?.social_facebook ?? null,
                contactEmail: trustFields?.contact_email ?? null,
              }} />
              <p className="text-xs text-wj-muted mt-1 px-4">
                {jars.length} jar{jars.length !== 1 ? "s" : ""} · {posts.length} post{posts.length !== 1 ? "s" : ""}
              </p>
            </div>
            {isOwn && (
              <div className="flex items-center gap-2 shrink-0 px-4 pt-2">
```

(Leave the rest of that block — the `Edit`/`Sign out` buttons and their closing tags — unchanged; only the avatar+name JSX inside is replaced. `profile.is_premium`'s ★ badge is dropped from here since `ProfileHeader` doesn't render it — premium and verified are different concepts; if premium status should still show, that's a separate, smaller follow-up, not blocking this task.) Apply the same replacement to the desktop block (`hidden md:block rounded-2xl` card) — same JSX swap, same `ProfileHeader` call.

Add the import:

```tsx
import ProfileHeader from "@/components/ProfileHeader";
```

- [ ] **Step 2: Fix the tab label**

Replace both occurrences (mobile and desktop pill row) of:

```tsx
                {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "posts" ? posts.length : jars.length})
```

with:

```tsx
                {t === "jars" ? "My Jars" : "Posts"} ({t === "posts" ? posts.length : jars.length})
```

- [ ] **Step 3: Fix this page's own "not found" link (part of the link sweep, in a file already being touched)**

```tsx
        <a href="/" className="mt-2 inline-block text-sm text-wj-plum hover:underline">← Home</a>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual browser check**

Visiting any `/u/[username]` shows cover + avatar + name (or `@username` if no first/last name set) + location (if set) + socials (only non-empty ones) + bio, on both mobile and desktop widths. Tab reads "My Jars", not "Jars". Before migration applied: page still loads (trust fields blank, no crash) since the trust-fields query is separate from the core `profileData` query.

- [ ] **Step 6: Commit**

```bash
git add src/app/u/\[username\]/page.tsx
git commit -m "feat: wire ProfileHeader into public profile, fix My Jars tab label"
```

---

## Task 12: Internal link sweep — every remaining `/dashboard` and `/feed` reference

**Files:**
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/jars/[id]/page.tsx`
- Modify: `src/app/jars/new/page.tsx`
- Modify: `src/app/jars/[id]/edit/page.tsx`
- Modify: `src/app/setup/username/page.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/notifications/page.tsx`

**Interfaces:** none — every change in this task is a literal string swap, no signature changes.

This is every `"/dashboard"` and `"/feed"` occurrence found by the live-code audit that isn't already covered by Tasks 3, 4, 6, 10, or 11.

- [ ] **Step 1: `src/components/SiteHeader.tsx`**

Two lines change:
```tsx
            <a href={username ? "/dashboard" : "/"} className="flex items-center gap-1.5">
```
→
```tsx
            <a href="/" className="flex items-center gap-1.5">
```
and:
```tsx
            {link("/dashboard", "Home", "home")}
            {link("/feed", "Feed", "feed")}
```
→
```tsx
            {link("/", "Home", "home")}
            {link("/jars", "Jars", "feed")}
```
(Keeping the `"feed"` string as the `activeTab` key value is intentional — it's just a discriminant name, not a URL; renaming it would touch every `activeTab="feed"` call site across the app for zero behavioral benefit. YAGNI.)

- [ ] **Step 2: `src/app/settings/page.tsx`**

```tsx
          <a href="/dashboard" className="text-wj-plum hover:underline">← Home</a>
```
→
```tsx
          <a href="/" className="text-wj-plum hover:underline">← Home</a>
```

- [ ] **Step 3: `src/app/jars/[id]/page.tsx`**

```tsx
        <a href="/dashboard" className="mt-3 inline-block text-sm text-wj-plum hover:underline">← Back to Home</a>
```
→
```tsx
        <a href="/" className="mt-3 inline-block text-sm text-wj-plum hover:underline">← Back to Home</a>
```

- [ ] **Step 4: `src/app/jars/new/page.tsx`**

Three `"/dashboard"` links (lines 116, 140, 228 in the pre-plan file) all become `"/"`:
```tsx
            <a href="/dashboard" className="text-wj-muted hover:text-wj-text">← Home</a>
```
→
```tsx
            <a href="/" className="text-wj-muted hover:text-wj-text">← Home</a>
```
(applies to both occurrences of this exact line), and:
```tsx
              href="/dashboard"
```
→
```tsx
              href="/"
```
Also fix the `atLimit` screen's "View my jars" link, which currently points at `/jars` (now the discovery page, not "my jars" — should point at the user's own profile jars tab instead). This requires the username, which isn't currently in scope in this component — add it via `requireUsername()`'s existing call (already made in this file's `check` effect from Task 8; capture `auth.username` into a new state var):
```tsx
const [ownUsername, setOwnUsername] = useState("");
// inside check(): after `const auth = await requireUsername(); if (!auth) return;` add:
setOwnUsername(auth.username);
```
and change:
```tsx
          <a href="/jars" className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
            View my jars
          </a>
```
to:
```tsx
          <a href={`/u/${ownUsername}`} className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
            View my jars
          </a>
```

- [ ] **Step 5: `src/app/jars/[id]/edit/page.tsx`**

```tsx
    window.location.href = "/dashboard";
```
→
```tsx
    window.location.href = "/";
```

- [ ] **Step 6: `src/app/setup/username/page.tsx`**

Both occurrences:
```tsx
      if (profile?.username) { window.location.href = "/dashboard"; return; }
```
→
```tsx
      if (profile?.username) { window.location.href = "/"; return; }
```
and:
```tsx
    window.location.href = "/dashboard";
```
→
```tsx
    window.location.href = "/";
```

- [ ] **Step 7: `src/app/reset-password/page.tsx`**

```tsx
    setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
```
→
```tsx
    setTimeout(() => { window.location.href = "/"; }, 2000);
```

- [ ] **Step 8: `src/app/login/page.tsx`**

```tsx
    window.location.href = profile?.username ? "/dashboard" : "/setup/username";
```
→
```tsx
    window.location.href = profile?.username ? "/" : "/setup/username";
```

- [ ] **Step 9: `src/app/notifications/page.tsx`**

```tsx
          <a href="/dashboard" className="text-wj-plum hover:underline">← Home</a>
```
→
```tsx
          <a href="/" className="text-wj-plum hover:underline">← Home</a>
```

- [ ] **Step 10: Verify the sweep is complete**

Run:
```bash
grep -rn '"/dashboard"' src --include="*.tsx" --include="*.ts"
grep -rn '"/feed"' src --include="*.tsx" --include="*.ts"
```
Expected: zero results for both (every occurrence found during the audit has been changed across Tasks 3, 4, 6, 10, 11, and this task).

- [ ] **Step 11: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 12: Manual browser check**

Click through: Settings "← Home", jar detail "← Back to Home", jar-limit "View my jars", notifications "← Home", post-login/signup/reset-password redirects, jar-creation-cancel — all land on `/` or the correct new target, none 404 or hit the old `/dashboard`/`/feed` stubs unnecessarily (landing on the stub and bouncing once is acceptable but everything above should skip the stub entirely since they're now direct).

- [ ] **Step 13: Commit**

```bash
git add src/components/SiteHeader.tsx src/app/settings/page.tsx "src/app/jars/[id]/page.tsx" src/app/jars/new/page.tsx "src/app/jars/[id]/edit/page.tsx" src/app/setup/username/page.tsx src/app/reset-password/page.tsx src/app/login/page.tsx src/app/notifications/page.tsx
git commit -m "fix: update remaining internal links from /dashboard and /feed"
```

---

## Task 13: `posts.jar_id NOT NULL` — human-gated, separate from the rest of this plan

**Files:**
- Create: `supabase/migrations/20260703140000_posts_jar_id_not_null.sql` (only after Step 1's count comes back 0, or after Step 3's human decision)

This task is intentionally last and intentionally not bundled into Task 1: it can destroy live data if run blind. Since Task 7 already makes the UI incapable of creating a new null-`jar_id` post, this constraint is a data-integrity backstop, not a blocker for anything else in this plan — it's safe to leave for later if the human wants to defer it.

- [ ] **Step 1: Ask the human to run the count check**

In Supabase Studio SQL Editor:
```sql
select count(*) from posts where jar_id is null;
```

- [ ] **Step 2: If the count is 0**

Create `supabase/migrations/20260703140000_posts_jar_id_not_null.sql`:
```sql
alter table posts alter column jar_id set not null;
```
Hand to the human to paste into Supabase Studio. Verify:
```sql
select is_nullable from information_schema.columns where table_name = 'posts' and column_name = 'jar_id';
```
Expected: `NO`.

- [ ] **Step 3: If the count is greater than 0**

Stop. Do not write or run a `delete` statement. Report the exact count to the human and ask explicitly: delete those rows, or leave the column nullable indefinitely (Task 7's UI-level requirement already prevents new violations, so leaving it nullable is a safe, low-urgency choice, not a broken state).

---

## Task 14: Final whole-branch review + full manual verification pass

**Files:** none (verification only).

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 2: Run the spec's test checklist end to end**

From `docs/superpowers/specs/2026-07-03-ia-redesign-design.md` §"Test / Doğrulama", in the browser:
- `/` signed-out shows the old landing page.
- `/` signed-in shows Home Timeline; an old `/dashboard` link redirects to `/`.
- An old `/feed` link redirects to `/jars`.
- `/jars` does not show your own jars; shows discovery content.
- An unverified account visiting `/jars/new` sees the gate, not the form.
- Filling first/last name + city + country + phone in Settings flips `is_verified` to true (and back to false if one is cleared) — confirm via `/jars/new` gate disappearing/reappearing.
- A jar-less account sees the composer replaced by a CTA on both Home and their own Profile; a jar-owning account cannot submit a post without picking a jar.
- Profile page's My Jars tab still works; header shows cover/name/location/socials/verified badge, blank fields hidden.
- Visiting another user's profile never shows their manifesto (Network tab: confirm `profiles_public` is queried for others, not raw `manifest_line1/2`).
- `curl` with the anon key against `profiles?select=manifest_line1` returns `42501` (only valid after Task 1's migration is applied).
- BottomNav on mobile shows icon-only, order Home/Jars/Create/Profile.

- [ ] **Step 3: Request code review**

Use superpowers:requesting-code-review for the full range of commits from this plan (base: the commit before Task 1, head: Task 12's final commit). Flag the Task 4 "followed-or-own" design decision explicitly for the human's attention — it's a product judgment call made without a separate approval round, not a spec-mandated detail.

---

## Self-Review Notes

**Spec coverage:** §1 route table → Tasks 4, 6, 12. §2 component changes → Tasks 3, 4, 5, 7, 9, 10. §3 data model → Task 1 (deferred: §3's `posts.jar_id NOT NULL` → Task 13, correctly separated). §4 auth/verification → Tasks 2, 8. §5 bottom nav → Task 3 (mobile/desktop SiteHeader rule confirmed already compliant, no task needed). §6 profile tabs → Task 11. §7 Home timeline → Task 4. §8 Jars discovery → Task 6. §9 post composer → Task 7. §10 risk list → addressed inline in Tasks 1, 4, 8, 13. Jar card required fields → Task 9 (days-left explicitly excluded per 2026-07-03 product clarification: jars complete by reaching a goal amount, not a date — see spec's corrected JarCard section).

**Placeholder scan:** no TBD/TODO markers; every step shows complete code, not descriptions of code.

**Type consistency:** `requireUsername()`'s return type (`{ userId, username, isPremium, isVerified }`, Task 2) matches every consumer (Tasks 4, 8, 12). `ProfileHeaderData` (Task 10) field names match exactly what Task 11 constructs. `JarCardProps["jar"]`'s new `isVerified?: boolean` (Task 9) is optional so Task 6's discovery query (which doesn't currently select owner verification status) still type-checks without passing it.
