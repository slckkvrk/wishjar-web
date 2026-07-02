# Dashboard Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's "All / Jars / Complete" jar-listing top section with a personalized hero card (avatar upload + private "manifesto" note) and a community post feed with an inline composer.

**Architecture:** New small, focused components (`HomeHeroCard`, `EditableAvatar`, `ManifestoText`, `PostComposer`, `PostCard`) replace inline JSX currently duplicated across `dashboard/page.tsx`, `feed/page.tsx`, and `u/[username]/page.tsx`. `AvatarCircle` gains an optional `avatarUrl` prop so photos render wherever it's already used. Two new `profiles` columns (`manifest_line1`, `manifest_line2`) plus `avatar_url` and a new `avatars` Storage bucket back the feature. `/feed` and `/jars` are explicitly untouched (separate future specs).

**Tech Stack:** Next.js App Router (client components, `"use client"`), Supabase (Postgres + Storage + JS client), Tailwind (existing `wj-*` design tokens in `globals.css`).

## Global Constraints

- All new user-facing copy (labels, placeholders, empty states, error messages) must be **simple English**, never Turkish, per standing project convention — even though this plan and code comments may be discussed in Turkish.
- Repo has **no automated test infrastructure**. Every task's "verify" step is a manual, in-browser check — do not invent a test runner or add one.
- The Supabase CLI in this environment has **no access token** (`SUPABASE_ACCESS_TOKEN` unset). Any SQL migration must be pasted into Supabase Studio's SQL Editor by a human before that task's browser verification can be completed. Flag this clearly and wait for confirmation before verifying.
- `supabase/` is **gitignored** in this repo (confirmed via `git check-ignore`). Do not `git add`/commit anything under `supabase/migrations/` — only application code and docs get committed.
- Follow the existing Tailwind utility conventions already used throughout the codebase (`wj-cream`, `wj-card`, `wj-card-border`, `wj-plum`, `wj-plum-mid`, `wj-gold`/`wj-gold-light`/`wj-gold-card`, `wj-text`, `wj-muted`, `var(--wj-shadow)`). Do not introduce a new styling approach (e.g. CSS modules, styled-components) — inline Tailwind classes + the existing `:root`/`@theme` tokens in `src/app/globals.css` only.
- Every page/component in this codebase is a client component (`"use client"` at the top). Follow this pattern — no server components/server actions are used anywhere in the app currently.

---

## Task 1: Database schema — profile columns + avatars Storage bucket

**Files:**
- Create: `supabase/migrations/20260703100000_dashboard_redesign_profile_columns.sql`
- Create: `supabase/migrations/20260703110000_avatars_storage_bucket.sql`

**Interfaces:**
- Produces: `profiles.manifest_line1` (`text`, nullable), `profiles.manifest_line2` (`text`, nullable), `profiles.avatar_url` (`text`, nullable). Storage bucket `avatars` (public read, per-user-folder write) with path convention `avatars/{user_id}/{filename}`. All later tasks read/write these.

- [ ] **Step 1: Write the profile columns migration**

```sql
-- supabase/migrations/20260703100000_dashboard_redesign_profile_columns.sql
alter table profiles
  add column if not exists manifest_line1 text,
  add column if not exists manifest_line2 text,
  add column if not exists avatar_url text;
```

- [ ] **Step 2: Write the avatars Storage bucket + policies migration**

```sql
-- supabase/migrations/20260703110000_avatars_storage_bucket.sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 3: Ask the human to apply both migrations**

Tell the user: "Please paste the contents of `supabase/migrations/20260703100000_dashboard_redesign_profile_columns.sql` and then `supabase/migrations/20260703110000_avatars_storage_bucket.sql` into Supabase Studio's SQL Editor for project `wkqblgefvcvzufbqdbie`, and run them in that order." Wait for confirmation before continuing.

- [ ] **Step 4: Verify in Supabase Studio**

Ask the user to run this in the SQL Editor and confirm it returns 3 rows (`manifest_line1`, `manifest_line2`, `avatar_url`) and one bucket row:

```sql
select column_name from information_schema.columns
where table_name = 'profiles' and column_name in ('manifest_line1', 'manifest_line2', 'avatar_url');

select id, public from storage.buckets where id = 'avatars';
```

Expected: first query returns 3 rows, second returns one row with `public = true`.

Do not proceed to Task 3 (avatar upload) until this is confirmed — Tasks 2, 5, 6 (components with no DB dependency) can proceed in parallel if needed, but nothing that writes `avatar_url`/`manifest_line*` can be verified end-to-end until this migration is applied.

---

## Task 2: `AvatarCircle` — support a real photo

**Files:**
- Modify: `src/components/AvatarCircle.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `AvatarCircle({ name, size, avatarUrl })` — new optional prop `avatarUrl?: string | null`. When set and non-empty, renders an `<img>` instead of the initial-letter circle. All later tasks (`EditableAvatar`, `PostCard`, profile page) pass this prop.

- [ ] **Step 1: Add the `avatarUrl` prop**

```tsx
// src/components/AvatarCircle.tsx
type Props = { name: string; size?: "sm" | "md" | "lg"; avatarUrl?: string | null };

const sizes = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

export default function AvatarCircle({ name, size = "md", avatarUrl }: Props) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 bg-wj-plum`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-wj-plum`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
```

- [ ] **Step 2: Verify existing usages still compile**

Run: `cd /Users/selcukkivrak/Projects/wishjar-web && npx tsc --noEmit`
Expected: no new type errors (all existing call sites like `<AvatarCircle name={profile.username} size="lg" />` omit `avatarUrl`, which is optional, so they still type-check).

- [ ] **Step 3: Commit**

```bash
git add src/components/AvatarCircle.tsx
git commit -m "feat: support real photo in AvatarCircle via avatarUrl prop"
```

---

## Task 3: `EditableAvatar` — click-to-upload photo

**Files:**
- Create: `src/components/EditableAvatar.tsx`

**Interfaces:**
- Consumes: `AvatarCircle` from Task 2 (`{ name, size, avatarUrl }`); `supabase` client from `@/lib/supabase`; requires `profiles.avatar_url` column and `avatars` bucket from Task 1.
- Produces: `EditableAvatar({ userId, username, avatarUrl }: { userId: string; username: string; avatarUrl: string | null })` — a clickable circle that opens a file picker, uploads to Storage, and persists `profiles.avatar_url`. Used by `HomeHeroCard` (Task 4).

- [ ] **Step 1: Write the component**

```tsx
// src/components/EditableAvatar.tsx
"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import AvatarCircle from "./AvatarCircle";

type Props = { userId: string; username: string; avatarUrl: string | null };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function EditableAvatar({ userId, username, avatarUrl }: Props) {
  const [url, setUrl] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Max file size is 5MB.");
      return;
    }

    setError("");
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadErr) {
      setUploading(false);
      setError("Upload failed. Please try again.");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateErr } = await supabase
      .from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId);
    setUploading(false);
    if (updateErr) {
      setError("Could not save your photo. Please try again.");
      return;
    }
    setUrl(pub.publicUrl);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="block rounded-full disabled:opacity-60"
        aria-label="Change profile photo"
        title="Change profile photo"
      >
        <AvatarCircle name={username} size="lg" avatarUrl={url} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      {error && (
        <p className="absolute top-full left-0 mt-1 w-36 text-[10px] leading-tight text-red-600">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/EditableAvatar.tsx
git commit -m "feat: add click-to-upload EditableAvatar component"
```

(Browser verification of the actual upload happens in Task 8, once `HomeHeroCard` is wired into the dashboard — this component has no page to render it standalone.)

---

## Task 4: `ManifestoText` + `HomeHeroCard`

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ManifestoText.tsx`
- Create: `src/components/HomeHeroCard.tsx`

**Interfaces:**
- Consumes: `EditableAvatar` from Task 3.
- Produces: `ManifestoText({ line1, line2 }: { line1: string | null; line2: string | null })` — reused by the Settings manifesto page (Task 10) for its live preview. `HomeHeroCard({ userId, username, avatarUrl, manifestLine1, manifestLine2 })` — reused by the dashboard (Task 8).

- [ ] **Step 1: Add gradient tokens to globals.css**

```css
/* src/app/globals.css — add inside :root, alongside --wj-shadow */
--wj-hero-grad-start: #EDE6FB;
--wj-hero-grad-end: #F7F1FC;
```

Full `:root` block after this change:

```css
:root {
  --wj-shadow: 0 2px 12px rgba(61,26,36,0.08);
  --wj-hero-grad-start: #EDE6FB;
  --wj-hero-grad-end: #F7F1FC;
}
```

- [ ] **Step 2: Write `ManifestoText`**

```tsx
// src/components/ManifestoText.tsx
type Props = { line1: string | null; line2: string | null };

export default function ManifestoText({ line1, line2 }: Props) {
  if (!line1 && !line2) {
    return <p className="text-sm italic underline text-wj-text/90">What you write here becomes real.</p>;
  }
  return (
    <div>
      {line1 && <p className="text-sm text-wj-text">{line1}</p>}
      {line2 && <p className="text-sm italic underline text-wj-text/90">{line2}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Write `HomeHeroCard`**

```tsx
// src/components/HomeHeroCard.tsx
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
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/ManifestoText.tsx src/components/HomeHeroCard.tsx
git commit -m "feat: add ManifestoText and HomeHeroCard components"
```

(Browser verification happens in Task 8 once wired into the dashboard.)

---

## Task 5: `PostComposer`

**Files:**
- Create: `src/components/PostComposer.tsx`

**Interfaces:**
- Consumes: `sanitizeText` from `@/lib/validate`; `supabase` client.
- Produces: `PostComposer({ userId, jars, onPosted })` where `jars: { id: string; title: string }[]` and `onPosted: (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => void`. Used by the dashboard (Task 8) and the profile page (Task 7).

- [ ] **Step 1: Write the component**

```tsx
// src/components/PostComposer.tsx
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

  const handlePost = async () => {
    const cleaned = sanitizeText(content, 500);
    if (!cleaned) return;
    setPosting(true);
    setError("");
    const { data: inserted, error: err } = await supabase
      .from("posts")
      .insert({ user_id: userId, content: cleaned, jar_id: jarId || null })
      .select("id, content, jar_id, created_at")
      .single();
    setPosting(false);
    if (err || !inserted) {
      setError(err?.message ?? "Could not post. Please try again.");
      return;
    }
    const jarTitle = jarId ? (jars.find((j) => j.id === jarId)?.title ?? null) : null;
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
          <option value="">Link a jar (optional)</option>
          {jars.map((j) => <option key={j.id} value={j.id}>🫙 {j.title}</option>)}
        </select>
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
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

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostComposer.tsx
git commit -m "feat: extract PostComposer component"
```

---

## Task 6: `PostCard`

**Files:**
- Create: `src/components/PostCard.tsx`

**Interfaces:**
- Consumes: `AvatarCircle` from Task 2; `timeAgo` from `@/lib/time`.
- Produces: `PostCard({ username, avatarUrl, createdAt, content, jarId, jarTitle, showAuthor, onDelete })`. Used by the dashboard (Task 8, `showAuthor=true`, no `onDelete`) and the profile page (Task 7, `showAuthor=false`, `onDelete` when viewing your own profile).

- [ ] **Step 1: Write the component**

```tsx
// src/components/PostCard.tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostCard.tsx
git commit -m "feat: extract PostCard component"
```

---

## Task 7: Refactor the profile page to use the shared components

**Files:**
- Modify: `src/app/u/[username]/page.tsx`

**Interfaces:**
- Consumes: `PostComposer` (Task 5), `PostCard` (Task 6), `AvatarCircle` with `avatarUrl` (Task 2).
- Produces: no new exports — this is a consumer-only change. Confirms the shared components work in a second real page before Task 8 builds on them.

- [ ] **Step 1: Add `avatar_url` to the `Profile` type and query**

Change:
```tsx
type Profile = { id: string; username: string; bio: string | null; created_at: string; is_premium: boolean; };
```
to:
```tsx
type Profile = { id: string; username: string; bio: string | null; created_at: string; is_premium: boolean; avatar_url: string | null; };
```

Change the select in `load()`:
```tsx
const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at, is_premium").eq("username", username).single();
```
to:
```tsx
const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at, is_premium, avatar_url").eq("username", username).single();
```

- [ ] **Step 2: Pass `avatarUrl` to both `AvatarCircle` instances**

There are two occurrences of `<AvatarCircle name={profile.username} size="lg" />` (mobile hero, desktop card). Change both to:
```tsx
<AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatar_url} />
```

- [ ] **Step 3: Replace the inline post composer with `PostComposer`**

Remove these state variables (no longer needed — `PostComposer` owns them internally):
```tsx
const [postContent, setPostContent] = useState("");
const [postJarId, setPostJarId] = useState("");
const [posting, setPosting] = useState(false);
const [postError, setPostError] = useState("");
```

Remove the `handlePost` function entirely (its logic now lives inside `PostComposer`).

Remove the `sanitizeText` import (no longer used directly in this file).

Add a handler that prepends the new post, replacing the removed `handlePost`'s tail behavior:
```tsx
const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
  setPosts((prev) => [post, ...prev]);
};
```

Replace the entire "Post composer" block:
```tsx
{/* Post composer */}
{isOwn && (
  <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
    <h2 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">New Post</h2>
    <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)}
      placeholder="What's on your mind?"
      rows={3} maxLength={500}
      className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2 text-sm outline-none focus:border-wj-plum text-wj-text" />
    <div className="flex items-center gap-2 mt-2">
      <select value={postJarId} onChange={(e) => setPostJarId(e.target.value)}
        className="flex-1 rounded-xl border border-wj-card-border bg-wj-card px-3 py-1.5 text-xs outline-none text-wj-text">
        <option value="">Link a jar (optional)</option>
        {jars.map((j) => <option key={j.id} value={j.id}>🫙 {j.title}</option>)}
      </select>
      <button onClick={handlePost} disabled={posting || !postContent.trim()}
        className="rounded-xl bg-wj-plum px-4 py-1.5 text-xs font-bold text-white hover:bg-wj-plum-mid disabled:opacity-50">
        {posting ? "Posting…" : "Post"}
      </button>
    </div>
    {postError && <p className="mt-2 text-xs text-red-600">{postError}</p>}
  </div>
)}
```
with:
```tsx
{/* Post composer */}
{isOwn && currentUserId && (
  <PostComposer userId={currentUserId} jars={jars} onPosted={handlePosted} />
)}
```

Add the import:
```tsx
import PostComposer from "@/components/PostComposer";
```

- [ ] **Step 4: Replace the inline post list with `PostCard`**

Replace:
```tsx
<div className="space-y-2">
  {posts.map((post) => (
    <div key={post.id} className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-wj-muted">{timeAgo(post.created_at)}</span>
        {isOwn && (
          <button onClick={() => handleDeletePost(post.id)} className="text-xs text-wj-muted hover:text-red-500">
            Delete
          </button>
        )}
      </div>
      <p className="text-sm leading-6 text-wj-text">{post.content}</p>
      {post.jar_title && post.jar_id && (
        <div className="mt-2">
          <a href={`/jars/${post.jar_id}`} className="inline-block rounded-xl border border-wj-gold-card bg-wj-gold-light px-2.5 py-1 text-xs font-semibold text-wj-text hover:opacity-80">
            🫙 {post.jar_title}
          </a>
        </div>
      )}
    </div>
  ))}
</div>
```
with:
```tsx
<div className="space-y-2">
  {posts.map((post) => (
    <PostCard
      key={post.id}
      username={profile.username}
      createdAt={post.created_at}
      content={post.content}
      jarId={post.jar_id}
      jarTitle={post.jar_title}
      showAuthor={false}
      onDelete={isOwn ? () => handleDeletePost(post.id) : undefined}
    />
  ))}
</div>
```

Add the import:
```tsx
import PostCard from "@/components/PostCard";
```

The `timeAgo` import stays (still used nowhere else in this file after removal — check and remove if now unused; it was only used in the block just replaced, so remove `import { timeAgo } from "@/lib/time";` if no other usage remains in the file).

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors, no unused-import errors.

- [ ] **Step 6: Browser verification**

Requires Task 1's migration applied. Start the dev server (`npm run dev`), log in, go to your own profile page:
- Confirm the post composer still works (post with and without a linked jar).
- Confirm your own posts still show the 🫙 badge and a working Delete button.
- Confirm someone else's profile page still renders (no composer, no delete buttons, posts read-only).

- [ ] **Step 7: Commit**

```bash
git add src/app/u/\[username\]/page.tsx
git commit -m "refactor: use shared PostComposer/PostCard/AvatarCircle on profile page"
```

---

## Task 8: Rewrite the dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx` (full rewrite of the body — this is the task a reviewer should scrutinize most closely)

**Interfaces:**
- Consumes: `HomeHeroCard` (Task 4), `PostComposer` (Task 5), `PostCard` (Task 6).
- Produces: nothing new — this is the final consumer that makes the whole feature visible end-to-end.

- [ ] **Step 1: Replace the full file contents**

```tsx
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import HomeHeroCard from "@/components/HomeHeroCard";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";

type Jar = { id: string; title: string };
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; avatarUrl: string | null; jar_title: string | null;
};

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [manifestLine1, setManifestLine1] = useState<string | null>(null);
  const [manifestLine2, setManifestLine2] = useState<string | null>(null);
  const [myJars, setMyJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      setUsername(auth.username);

      const [{ data: profile }, { data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase.from("profiles").select("avatar_url, manifest_line1, manifest_line2").eq("id", auth.userId).single(),
        supabase.from("jars").select("id, title").eq("user_id", auth.userId).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, user_id, jar_id, content, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      setAvatarUrl(profile?.avatar_url ?? null);
      setManifestLine1(profile?.manifest_line1 ?? null);
      setManifestLine2(profile?.manifest_line2 ?? null);
      setMyJars(jarsData ?? []);

      if (rawPosts && rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);
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
    };
    load();
  }, []);

  const handlePosted = (post: { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string }) => {
    setPosts((prev) => [
      { ...post, user_id: userId ?? "", username: username ?? "you", avatarUrl },
      ...prev,
    ]);
  };

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
      />

      <div className="px-4 md:mx-auto md:max-w-5xl space-y-3">
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors. `JarCard` import and `MAX_JARS`/`Tab`/`filteredJars` logic are gone entirely — confirm nothing else in the codebase imports dashboard-specific symbols that no longer exist (there shouldn't be any; this page has no exports besides the default component).

- [ ] **Step 3: Browser verification**

Requires Task 1's migration applied. Start the dev server, log in, go to `/dashboard`:
- Confirm "Create Jar" / "My Profile" buttons and "All / Jars / Complete" pills are gone.
- Confirm the hero card renders with the gradient background, greeting ("Hi, {username}", no emoji), placeholder manifesto text (*"What you write here becomes real."*), and the 🫙✨🎁🌿 illustration.
- Click the avatar circle, upload a JPG/PNG — confirm it replaces the initial letter immediately, and persists after a page reload.
- Post something from the dashboard composer, with and without linking one of your own jars — confirm it appears at the top of the feed immediately, with a clickable 🫙 badge (when linked) that goes to `/jars/{id}`.
- Confirm jar creation still works via the bottom nav "+" button (`/jars/new`).
- Confirm your own jars are still visible under the "Jars" tab on your profile page (`/u/{username}`), since the dashboard no longer lists them.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: replace dashboard jar tabs with hero card and post feed"
```

---

## Task 9: Settings page — add the Manifesto section

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: nothing new (plain link to the page built in Task 10).
- Produces: nothing new — links to `/settings/manifesto`.

- [ ] **Step 1: Insert a new section between "Profile" and "Account"**

After the existing "Profile link" block (ends with `</div>` before the `{/* Sign out */}` comment), insert:

```tsx
{/* Manifesto */}
<div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 mb-4" style={{ boxShadow: "var(--wj-shadow)" }}>
  <h2 className="text-sm font-bold text-wj-text mb-1">Manifesto</h2>
  <p className="text-xs text-wj-muted mb-3">The private note only you see on your home screen.</p>
  <a
    href="/settings/manifesto"
    className="inline-block rounded-xl border border-wj-card-border px-4 py-2 text-sm font-semibold text-wj-text hover:bg-wj-cream"
  >
    Edit manifesto →
  </a>
</div>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add Manifesto section to Settings"
```

(The link will 404 until Task 10 creates the target page — that's fine, Task 10 lands immediately after.)

---

## Task 10: Settings manifesto edit page

**Files:**
- Create: `src/app/settings/manifesto/page.tsx`

**Interfaces:**
- Consumes: `ManifestoText` (Task 4), `requireUsername`, `sanitizeText`.
- Produces: nothing new — terminal page for this feature.

- [ ] **Step 1: Write the page**

```tsx
// src/app/settings/manifesto/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import ManifestoText from "@/components/ManifestoText";
import { sanitizeText } from "@/lib/validate";

export default function ManifestoSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setUserId(auth.userId);
      const { data: profile } = await supabase
        .from("profiles").select("manifest_line1, manifest_line2").eq("id", auth.userId).single();
      setLine1(profile?.manifest_line1 ?? "");
      setLine2(profile?.manifest_line2 ?? "");
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const cleanedLine1 = sanitizeText(line1, 60) || null;
    const cleanedLine2 = sanitizeText(line2, 60) || null;
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ manifest_line1: cleanedLine1, manifest_line2: cleanedLine2 })
      .eq("id", userId);
    setSaving(false);
    if (updateErr) {
      setError(`Error: ${updateErr.message}`);
      return;
    }
    setLine1(cleanedLine1 ?? "");
    setLine2(cleanedLine2 ?? "");
    setSuccess(true);
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a href="/settings" className="text-wj-plum hover:underline">← Settings</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Manifesto</h1>
          <p className="text-xs text-wj-muted mt-0.5">Only you see this. What you write here becomes real.</p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div>
            <label className={labelCls}>Line 1</label>
            <input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              maxLength={60}
              placeholder="Good things are coming."
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{line1.length}/60</p>
          </div>
          <div>
            <label className={labelCls}>Line 2</label>
            <input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              maxLength={60}
              placeholder="I'm ready for them."
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{line2.length}/60</p>
          </div>

          <div>
            <p className={labelCls}>Preview</p>
            <div className="rounded-xl border border-wj-card-border bg-wj-cream px-3 py-3">
              <ManifestoText line1={line1 || null} line2={line2 || null} />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">Saved!</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Browser verification**

Requires Task 1's migration applied. Start the dev server, log in, go to `/settings`, click "Edit manifesto →":
- Confirm both fields load empty on a fresh account, and the preview shows the italic/underlined placeholder.
- Type text in both lines, confirm the preview updates live (line 1 plain, line 2 italic+underlined).
- Save, reload the page — confirm the saved values persist.
- Go to `/dashboard` — confirm the hero card now shows your two saved lines instead of the placeholder.
- Clear both fields and save — confirm the dashboard hero card reverts to the placeholder.

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/manifesto/page.tsx
git commit -m "feat: add Settings page for editing the manifesto note"
```

---

## Final End-to-End Check

After all 10 tasks:

1. Run `npx tsc --noEmit` one more time from repo root — expect zero errors.
2. Run `npm run build` — expect a successful production build (catches anything `tsc --noEmit` alone might miss, e.g. unused-export lint failures if `next lint` runs as part of build).
3. In the browser, walk through the full flow once more end-to-end: log in → land on `/dashboard` → see hero card with placeholder manifesto → upload an avatar → post with a jar tag → go to Settings → set a manifesto → back to `/dashboard` → see it rendered → visit your own profile page → confirm posts/avatar are consistent there too.
4. Confirm `/feed` and `/jars` were **not** modified (`git status` / `git diff` should show no changes to `src/app/feed/page.tsx` or `src/app/jars/`).
