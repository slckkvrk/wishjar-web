# WishJar Official Account & Premium Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a minimal premium-account foundation (unlimited jars + a profile badge), stand up an official `wishjar` account under it, clean out the placeholder test data currently in the feed, and seed the `wishjar` account with 7 researched social-responsibility jars and a few introductory posts.

**Architecture:** A single new boolean column (`profiles.is_premium`) gates the existing client-side `MAX_JARS` check in two pages and drives a small badge on the profile page. The official account and its jars/posts are created the same way every prior schema/data change in this project has been made: hand-applied SQL against the live Supabase project via `supabase db push --linked`, and the account itself is created by driving the real `/signup` → `/setup/username` flow, exactly as already verified for the throwaway `claude` test account earlier this session.

**Tech Stack:** Next.js (App Router, client components), Supabase JS client + Postgres/RLS, TypeScript, Supabase CLI (`npx supabase`) for migrations.

## Global Constraints

- No test framework exists in this repo — every task's verification step is a manual/browser check (see spec, and consistent with this repo's only other plan, `2026-07-02-jar-follow.md`).
- `supabase/` is gitignored; migration `.sql` files are written to `supabase/migrations/` and applied via `npx supabase db push --linked`, but are not committed to git (matches existing convention — see `20260702120000_jar_follows.sql` and `20260702130000_jar_follows_grants.sql`, already applied this session).
- No payment/donation processing exists yet (confirmed: no Stripe/checkout code anywhere in `src/`, and `src/app/terms/page.tsx` states WishJar does not purchase items on a user's behalf). All jar/post copy must avoid implying live donation processing.
- Premium is a manually-set flag only — no billing flow, no self-serve upgrade UI, no perk besides unlimited jars + the badge.
- The project's live Supabase project ref is `wkqblgefvcvzufbqdbie`; a valid `SUPABASE_ACCESS_TOKEN` must be exported before running any `supabase` CLI command (ask the user for a fresh personal access token from https://supabase.com/dashboard/account/tokens if none is active — tokens expire/get revoked between sessions).
- The dev server must be running (`npm run dev`, `http://localhost:3000`) for every browser-verification step and for Task 5's account creation.

---

### Task 1: Add `profiles.is_premium` column

**Files:**
- Create: `supabase/migrations/20260702140000_profiles_premium.sql`

**Interfaces:**
- Produces (used by Tasks 2–3): column `profiles.is_premium boolean not null default false`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260702140000_profiles_premium.sql`:

```sql
alter table profiles add column if not exists is_premium boolean not null default false;
```

- [ ] **Step 2: Apply it to the live database**

```bash
export SUPABASE_ACCESS_TOKEN=<token>
npx supabase db push --linked
```

Expected output: prompts to push `20260702140000_profiles_premium.sql`, then `Finished supabase db push.` with no errors.

- [ ] **Step 3: Verify the column exists and defaults correctly**

With the dev server running and logged in as any existing user (e.g. `claude`), open the browser console on any page and run:

```js
const { data } = await window.supabase.from("profiles").select("id, username, is_premium").limit(3);
console.log(data);
```

Expected: every row has `is_premium: false`. (If `window.supabase` isn't exposed, instead confirm via the REST check used earlier this session: `curl "$URL/rest/v1/profiles?select=username,is_premium&limit=3" -H "apikey: $KEY" -H "Authorization: Bearer <a logged-in user's access token>"` returns 200 with the new column.)

- [ ] **Step 4: Commit** (plan doc only — the `.sql` file itself is gitignored per this repo's convention)

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: start wishjar official account implementation plan"
```

---

### Task 2: Premium accounts bypass the 3-jar limit

**Files:**
- Modify: `src/lib/requireUsername.ts`
- Modify: `src/app/jars/new/page.tsx:33-69`
- Modify: `src/app/jars/page.tsx:15,17-37`

**Interfaces:**
- Consumes: `profiles.is_premium` (Task 1).
- Produces (used by Task 3 is unaffected — badge reads `profiles.is_premium` directly): `requireUsername()` now resolves to `{ userId: string; username: string; isPremium: boolean } | null` instead of `{ userId: string; username: string } | null`. Any other caller of `requireUsername` must still work since only a field was added, not removed.

- [ ] **Step 1: Extend `requireUsername` to also fetch `is_premium`**

In `src/lib/requireUsername.ts`, replace the whole file with:

```ts
import { supabase } from "./supabase";

export async function requireUsername(): Promise<{ userId: string; username: string; isPremium: boolean } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "/login"; return null; }
  const { data: profile } = await supabase
    .from("profiles").select("username, is_premium").eq("id", user.id).single();
  if (!profile?.username) { window.location.href = "/setup/username"; return null; }
  return { userId: user.id, username: profile.username, isPremium: profile.is_premium ?? false };
}
```

- [ ] **Step 2: Skip the limit check for premium accounts in `jars/new/page.tsx`**

In `src/app/jars/new/page.tsx`, replace the `useEffect` (currently lines 33-48):

```ts
  useEffect(() => {
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
    check();
  }, []);
```

And replace the re-check inside `handleCreate` (currently lines 55-69):

```ts
    const auth = await requireUsername();
    if (!auth) return;

    if (!auth.isPremium) {
      // Re-check limit at submit time
      const { count } = await supabase
        .from("jars")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("status", "active");

      if ((count ?? 0) >= MAX_JARS) {
        setAtLimit(true);
        setSaving(false);
        return;
      }
    }
```

- [ ] **Step 3: Skip the limit in `jars/page.tsx`**

In `src/app/jars/page.tsx`, add an `isPremium` state and use it in the `atLimit` calculation. Replace lines 17-37:

```ts
export default function JarsPage() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setIsPremium(auth.isPremium);
      const { data } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at, completed_at")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false });
      setJars(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = !isPremium && activeJars.length >= MAX_JARS;
```

- [ ] **Step 4: Manually verify the bypass works for a non-premium account**

With the dev server running, log in as the existing `claude` test account (created earlier this session) and visit `/jars/new`. Expected: since `claude` has 0 active jars and `is_premium` defaults to `false`, the form loads normally (not at-limit) — this confirms the new code path didn't break the ordinary case. (The premium bypass itself gets verified end-to-end in Task 8, once the `wishjar` account exists and is flagged premium.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/requireUsername.ts src/app/jars/new/page.tsx src/app/jars/page.tsx
git commit -m "feat: premium accounts bypass the 3-jar creation limit"
```

---

### Task 3: Premium badge on the profile page

**Files:**
- Modify: `src/app/u/[username]/page.tsx:12,39,113,158`

**Interfaces:**
- Consumes: `profiles.is_premium` (Task 1).

- [ ] **Step 1: Add `is_premium` to the `Profile` type and query**

In `src/app/u/[username]/page.tsx`, update line 12:

```ts
type Profile = { id: string; username: string; bio: string | null; created_at: string; is_premium: boolean; };
```

And update the profile query on line 39 to select the new column:

```ts
      const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at, is_premium").eq("username", username).single();
```

- [ ] **Step 2: Render the badge in the mobile hero**

Replace line 113:

```tsx
              <h1 className="text-xl font-bold text-wj-text">
                @{profile.username}
                {profile.is_premium && <span title="Premium account" className="ml-1.5 text-wj-gold">★</span>}
              </h1>
```

- [ ] **Step 3: Render the badge in the desktop card**

Replace line 158:

```tsx
                  <h1 className="text-base font-bold text-wj-text">
                    @{profile.username}
                    {profile.is_premium && <span title="Premium account" className="ml-1.5 text-wj-gold">★</span>}
                  </h1>
```

- [ ] **Step 4: Manually verify**

Visit `/u/claude` in the browser (non-premium account). Expected: no star badge next to `@claude`, page renders exactly as before. (The premium badge itself is verified end-to-end in Task 8 against `/u/wishjar`.)

- [ ] **Step 5: Commit**

```bash
git add src/app/u/\[username\]/page.tsx
git commit -m "feat: show a premium badge on profile pages"
```

---

### Task 4: Clean up existing test jars and posts

**Files:**
- Create: `supabase/migrations/20260702150000_cleanup_test_data.sql`

**Interfaces:**
- Produces (relied on by Tasks 6-8): an empty `jars`, `wishes`, `jar_follows`, and `posts` table. `profiles` and `auth.users` rows are untouched.

- [ ] **Step 1: Write the cleanup migration**

Create `supabase/migrations/20260702150000_cleanup_test_data.sql`:

```sql
delete from posts;
delete from jars;
```

(`jars` deletion cascades to `wishes` and `jar_follows` via their existing `on delete cascade` foreign keys from `supabase/migrations/20260702120000_jar_follows.sql` and the pre-existing `wishes.jar_id` foreign key.)

- [ ] **Step 2: Apply it**

```bash
export SUPABASE_ACCESS_TOKEN=<token>
npx supabase db push --linked
```

Expected: prompts to push `20260702150000_cleanup_test_data.sql`, then `Finished supabase db push.`

- [ ] **Step 3: Verify in the browser**

Visit `/feed` while logged in as any account. Expected: no jar cards, no "Community Posts" section (feed shows only its empty/welcome state). Visit `/u/slckkvrk`, `/u/merveatam`, `/u/claude` — all three profiles still load (accounts intact), each showing 0 jars and 0 posts.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: mark test-data cleanup step in wishjar plan"
```

---

### Task 5: Create the official `wishjar` account

**Files:**
- Create: `supabase/migrations/20260702160000_wishjar_premium_flag.sql`
- No app code changes — this task drives the existing signup UI.

**Interfaces:**
- Produces (relied on by Tasks 6-7): a `profiles` row with `username = 'wishjar'`, `is_premium = true`, and a bio, whose `id` the seed migrations in Tasks 6-7 look up via `(select id from profiles where username = 'wishjar')`.

- [ ] **Step 1: Sign up through the real UI**

With the dev server running, navigate to `http://localhost:3000/signup`. Fill in:
- Email: `slckkvrk+wishjar@gmail.com` (a Gmail plus-alias of the project owner's own address — password-reset mail lands in an inbox they already control)
- Password: generate a strong random password (e.g. 20+ characters, mixed case/digits/symbols)
- Check the terms checkbox, click "Create account"

Expected: redirected to `/setup/username` (same flow already verified this session for the `claude` account — no email confirmation required on this project).

- [ ] **Step 2: Set the username and bio**

On `/setup/username`, fill:
- Username: `wishjar`
- Bio: `WishJar'ın resmi hesabı. Desteklediğimiz sosyal sorumluluk projelerini burada paylaşıyoruz.`

Click "Continue". Expected: redirected to `/dashboard`, confirming the account now has a `profiles` row.

- [ ] **Step 3: Report the credentials to the user**

Tell the user, in the chat (do not write this password to any file or to the memory system — it's a live production credential):
- Email: `slckkvrk+wishjar@gmail.com`
- Password: `<the generated password from Step 1>`

- [ ] **Step 4: Write and apply the premium-flag migration**

Create `supabase/migrations/20260702160000_wishjar_premium_flag.sql`:

```sql
update profiles set is_premium = true where username = 'wishjar';
```

```bash
export SUPABASE_ACCESS_TOKEN=<token>
npx supabase db push --linked
```

Expected: `Finished supabase db push.`

- [ ] **Step 5: Verify**

Visit `http://localhost:3000/u/wishjar`. Expected: profile loads, bio is visible, and the ★ badge from Task 3 now appears next to `@wishjar` (confirms `is_premium = true` took effect).

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: mark wishjar account creation step in plan"
```

---

### Task 6: Seed the 7 charity jars

**Files:**
- Create: `supabase/migrations/20260702170000_seed_wishjar_jars.sql`

**Interfaces:**
- Consumes: `profiles` row from Task 5 (`username = 'wishjar'`).
- Produces (relied on by Task 7): 7 rows in `jars`, 3 of which (the funded ones) are referenced by title in Task 7's post-seeding lookups.

- [ ] **Step 1: Write the seed migration**

Create `supabase/migrations/20260702170000_seed_wishjar_jars.sql`:

```sql
insert into jars (user_id, title, description, category, goal_amount)
select id, v.title, v.description, 'Charity', v.goal_amount
from profiles, (values
  ('Dünyada Açlığı Bitirmek',
   'İnsanlığın en temel sorunlarından biri: açlık. Bu kavanoz açlıkla mücadeleye olan bağlılığımızı simgeler ve hep açık kalacak.',
   null::numeric),
  ('Okyanuslardaki Plastik Kirliliğini Temizlemek',
   'Denizlerimizi ve okyanuslarımızı plastikten arındırmak uzun soluklu bir mücadele. Bu kavanoz bu amaca adanmıştır ve hiçbir zaman kapanmayacak.',
   null::numeric),
  ('Her Çocuğa Eşit Eğitim İmkanı',
   'Dünyanın her yerinde her çocuğun kaliteli eğitime erişebilmesi için. Bu kavanoz sürekli açık kalacak.',
   null::numeric),
  ('İklim Değişikliğiyle Mücadele',
   'Gezegenimizi korumak hepimizin sorumluluğu. Bu kavanoz iklim değişikliğiyle mücadeleye adanmıştır.',
   null::numeric),
  ('Afrika''da 1 Su Kuyusu',
   'Temiz suya erişimi olmayan bir topluluk için bir su kuyusu açmaya yetecek fonu bir araya getiriyoruz. Hedef, benzer projelerdeki ortalama kuyu açma maliyetine göre belirlendi.',
   12000),
  ('WishJar Ormanı (5.000 Fidan)',
   '5.000 fidan dikerek küçük bir orman kurmayı hedefliyoruz. Hedef tutar, fidan başına ortalama dikim maliyetine göre hesaplandı.',
   10000),
  ('Afet Yardım Fonu',
   'Herhangi bir yerde büyük bir afet olduğunda hızlıca devreye girebilecek bir acil yardım rezervi oluşturuyoruz. Bu kavanoz belirli bir afete bağlı değildir, her zaman hazır bulunur.',
   40000)
) as v(title, description, goal_amount)
where profiles.username = 'wishjar';
```

- [ ] **Step 2: Apply it**

```bash
export SUPABASE_ACCESS_TOKEN=<token>
npx supabase db push --linked
```

Expected: `Finished supabase db push.`

- [ ] **Step 3: Verify**

Visit `/u/wishjar` and switch to the "Jars" tab. Expected: 7 jars listed. Visit `/feed`: the 4 no-goal jars render without a progress bar (existing `jar.goal_amount &&` conditional in the jar card/detail components already handles this — no code change needed), and the 3 funded jars show `$0 / $12,000`, `$0 / $10,000`, `$0 / $40,000` respectively (no wishes have been added, so current value is $0).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: mark charity jar seeding step in plan"
```

---

### Task 7: Seed introductory posts

**Files:**
- Create: `supabase/migrations/20260702180000_seed_wishjar_posts.sql`

**Interfaces:**
- Consumes: `profiles` row from Task 5, `jars` rows from Task 6 (looked up by title).

- [ ] **Step 1: Write the seed migration**

Create `supabase/migrations/20260702180000_seed_wishjar_posts.sql`:

```sql
insert into posts (user_id, jar_id, content)
select p.id, j.id, v.content
from profiles p
join (values
  ('Afrika''da 1 Su Kuyusu', 'Afrika''da bir su kuyusu açmak için harekete geçtik 💧 Temiz suya erişim, birçok toplum için hâlâ bir hayal. Bu kavanozla bu hayali gerçeğe dönüştürmeye hazırlanıyoruz.'),
  ('WishJar Ormanı (5.000 Fidan)', 'WishJar Ormanı''nı büyütüyoruz 🌱 5.000 fidanla küçük ama etkili bir adım atmayı hedefliyoruz.'),
  ('Afet Yardım Fonu', 'Afetler haber vermeden gelir. Bu yüzden her zaman hazır bir yardım fonu oluşturuyoruz 🤝')
) as v(jar_title, content) on true
join jars j on j.title = v.jar_title and j.user_id = p.id
where p.username = 'wishjar';
```

- [ ] **Step 2: Apply it**

```bash
export SUPABASE_ACCESS_TOKEN=<token>
npx supabase db push --linked
```

Expected: `Finished supabase db push.`

- [ ] **Step 3: Verify**

Visit `/feed`. Expected: a "Community Posts" section appears with 3 posts from `@wishjar`, each linking to its respective jar.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: mark post seeding step in plan"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Verify premium bypass for real**

Log in as `wishjar` (credentials from Task 5) and visit `/jars/new`. Expected: loads normally, not at-limit, even though the account already has 7 active jars (well above `MAX_JARS = 3`).

- [ ] **Step 2: Verify the badge**

Visit `/u/wishjar` logged out (or as a different account). Expected: ★ badge visible next to `@wishjar` to any visitor, not just when logged in as `wishjar`.

- [ ] **Step 3: Verify existing accounts are unaffected**

Log in as `slckkvrk`, `merveatam`, and `claude` in turn. Expected: each logs in fine, dashboard loads, `/jars/new` still enforces the 3-jar limit normally (they're not premium).

- [ ] **Step 4: Verify feed composition**

Visit `/feed` as `claude`. Expected: the 7 `wishjar` jars appear (mix of no-progress-bar and funded cards), the 3 posts appear under "Community Posts", and no leftover test jars/posts from before Task 4's cleanup remain.

- [ ] **Step 5: Final commit**

```bash
git add docs/superpowers/plans/2026-07-02-wishjar-official-account.md
git commit -m "docs: complete wishjar official account plan verification"
```
