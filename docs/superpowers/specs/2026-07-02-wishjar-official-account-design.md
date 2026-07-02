# WishJar Official Account & Premium Foundation — Design

## 1. Purpose

Solve the "empty platform" cold-start problem and give WishJar a first piece of brand-owned content: an official `wishjar` account that showcases social-responsibility jars. This also introduces the minimal foundation for a future premium account tier, since the official account needs to bypass the normal jar-creation limit.

Out of scope (deliberately, for separate future work):
- A periodic "bot" that auto-posts about the official account's jars (next project, likely built on the `schedule` cron mechanism).
- Real payment/donation processing. WishJar currently has no payment infrastructure (confirmed: no Stripe/checkout code, and `terms` page explicitly states WishJar does not purchase items on a user's behalf). The jars in this spec are prepared *ahead of* that future payment system — their copy must not imply real-time donation processing is already happening.
- Any premium perk beyond unlimited jars (no billing flow, no plan management UI).

## 2. Premium account foundation

- Add `profiles.is_premium boolean not null default false`.
- In `src/app/jars/new/page.tsx` and `src/app/jars/page.tsx`, the `MAX_JARS = 3` check is skipped when the current user's `profiles.is_premium` is `true` (fetch the flag alongside the existing profile/auth check already in those files).
- On the profile page (`src/app/u/[username]/page.tsx`), render a small badge (e.g. a star glyph) next to the username when `profile.is_premium` is `true`. No new component needed — inline JSX next to the existing username heading is enough.
- No purchase flow, no admin UI to toggle this flag — for now it's set directly via SQL. A future premium project can add self-serve upgrade later.

## 3. Official `wishjar` account

- Username: `wishjar`.
- Email: `slckkvrk+wishjar@gmail.com` (a Gmail plus-alias of the project owner's own address, so password-reset email lands in an inbox they already control, without needing a separate mailbox).
- Created through the normal signup flow (same path already verified for the `claude` test account: `/signup` → `/setup/username`), then `is_premium` is set to `true` directly via SQL.
- Bio (profiles.bio): a short, honest line identifying it as WishJar's official account and framing the jars as causes WishJar supports, without implying live donation processing is already active. Exact copy is an implementation-time wording detail, not a design decision — must avoid phrasing like "your donation is being sent" since no money actually moves yet.

## 4. Jar content

All jars use category `Charity` (already an existing category option) and belong to the `wishjar` account.

**Type 1 — perpetually open, no fixed goal.** `goal_amount` is left `null`; the existing jar-detail/jar-card rendering already skips the progress bar entirely when `goal_amount` is null, so these naturally read as ongoing causes with no "finished" state:
- Dünyada Açlığı Bitirmek
- Okyanuslardaki Plastik Kirliliğini Temizlemek
- Her Çocuğa Eşit Eğitim İmkanı
- İklim Değişikliğiyle Mücadele

**Type 2 — fundable, with a researched real-world target `goal_amount`:**
- **Afrika'da 1 Su Kuyusu** — $12,000. Based on charity well-drilling cost reporting of roughly $10,000–$15,000 per community borehole ([Water Wells For Africa](https://waterwellsforafrica.org/what-we-do/how-we-build-wells/whats-the-cost/), [Drop in the Bucket](https://dropinthebucket.org/cost-to-drill-a-well-in-africa/)).
- **WishJar Ormanı (5.000 fidan)** — $10,000. Based on reforestation charity per-tree costs in the ~$1.50–$3 range ([The Nature Conservancy](https://www.nature.org/en-us/get-involved/how-to-help/plant-a-billion/)).
- **Afet Yardım Fonu** — $40,000. Sized to cover emergency shelter kits (~$750/family, per [ShelterBox](https://shelterbox.org/what-we-do/aid-items/shelter-kits/)) for roughly 50 families; this is a standing reserve, not tied to any specific active disaster.

These 7 jars are inserted directly via SQL against the live database (consistent with this project's existing convention of applying schema/data changes by hand rather than through the UI for one-off setup work), not created by driving the `/jars/new` UI.

## 5. Sample posts

2-3 short posts from the `wishjar` account, each linked (`posts.jar_id`) to one of the Type 2 jars, introducing the initiative. Inserted via SQL alongside the jars, in the same honest, no-live-payments tone as the bio.

## 6. Feed cleanup

Before seeding the new content:
- Delete all existing rows in `jars` (cascades to `wishes` and `jar_follows` via existing foreign keys).
- Delete all existing rows in `posts`.
- Do **not** delete any `profiles` or `auth.users` rows — `slckkvrk`, `merveatam`, and `claude` accounts remain intact, just with no jars/posts.

## 7. Verification

- Confirm `wishjar` profile shows the premium badge and can create more than 3 jars without hitting the limit (already has 7 seeded, so simply confirming no "at limit" UI state is enough — no need to create an 8th).
- Confirm feed shows only the 7 new `wishjar` jars and the sample posts, with Type 1 jars rendering without a progress bar and Type 2 jars rendering with the correct goal amounts.
- Confirm `slckkvrk`, `merveatam`, `claude` logins still work and their profiles load (now with zero jars/posts).
