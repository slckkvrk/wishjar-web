# WishJar Mobile-First Redesign

**Date:** 2026-06-29  
**Status:** Approved  

## Overview

Full visual redesign of wishjar-web to match the provided mobile mockup: warm cream palette, plum/burgundy accents, golden completion cards, rounded cards with soft shadows, detailed SVG jar illustrations, and a hybrid navigation (bottom nav on mobile, top nav on desktop). All pages are in scope.

---

## 1. Design Token System

Defined in `src/app/globals.css` as CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--wj-cream` | `#F5EDD5` | Page background |
| `--wj-card` | `#FDFAF3` | Card background |
| `--wj-card-border` | `#E8DCBB` | Subtle card border |
| `--wj-plum` | `#3D1A24` | Primary: header bg, active nav, primary buttons |
| `--wj-plum-mid` | `#6B2D40` | Hover states, secondary plum |
| `--wj-gold` | `#C9973A` | Progress bar fill, accent |
| `--wj-gold-light` | `#F0D080` | Completed card background |
| `--wj-gold-card` | `#EDD98A` | Completed card border/accent |
| `--wj-text` | `#2C1A12` | Primary text |
| `--wj-muted` | `#9B7E6A` | Secondary/label text |
| `--wj-shadow` | `0 2px 12px rgba(61,26,36,0.08)` | Card shadow |

Dark mode: disabled (remove `prefers-color-scheme: dark` override — warm palette is light-only).

---

## 2. Shared Components

### `BottomNav` (`src/components/BottomNav.tsx`)
- Visible only on mobile (`md:hidden`)
- Fixed at bottom, `z-50`, cream background, plum top border
- 4 tabs: **Home** (house icon), **Jars** (jar icon), **Create** (+ icon, plum rounded square), **Profile** (person icon)
- Active tab: plum color; inactive: muted
- Links: Home=`/dashboard`, Jars=`/jars` (new dedicated page, user's jar list), Create=`/jars/new`, Profile=`/u/[username]`
- Fetches username via `supabase.auth.getUser()` + profiles table for Profile link
- Renders `null` if user is not logged in (self-contained auth check inside component)

### `SiteHeader` (updated, `src/components/SiteHeader.tsx`)
- Hidden on mobile (`hidden md:block`)
- Same nav structure as today, recolored with `--wj-plum` background
- Logo SVG recolored to gold/cream tones

### `PageHeader` (per-page inline, not a shared component)
- Each authenticated page has its own top section visible on mobile
- Home screen: avatar circle + "Hi, [name]" + subtitle + notification bell
- Jar list: "My Jars" title + count badge
- Other pages: page title only
- This is **not** a shared component — each page owns its header markup since content varies

### `JarCard` (`src/components/JarCard.tsx`)
- Two variants: **standard** and **completed** (golden background)
- Standard: white-cream card, rounded-2xl, shadow-wj
- Completed: `--wj-gold-light` background, sparkle decoration
- Layout: label text top-left ("Jar update" / "Completed today"), `•••` menu top-right
- Left column: AvatarCircle + username + jar title, description text, ProgressBar, days left
- Right column: JarIllustration (small, ~80px)
- Bottom: 2 action buttons (Followed/View Jar + Share)

### `AvatarCircle` (`src/components/AvatarCircle.tsx`)
- Props: `name: string`, `size?: "sm" | "md" | "lg"`
- Shows first letter of name, plum background, white text
- Sizes: sm=32px, md=40px, lg=64px

### `ProgressBar` (`src/components/ProgressBar.tsx`)
- Props: `value: number` (0–100), `label?: string`
- Cream track, gold fill, rounded-full
- Optional label shown to the right (e.g. "49%")

### `JarIllustration` (`src/components/JarIllustration.tsx`)
- Props: `variant: "empty" | "partial" | "full"`, `size?: number`
- Three inline SVG drawings:
  - `empty`: clear glass jar, silver lid, 1-2 paper scraps inside
  - `partial`: jar with paper scraps, small star decorations, gift box at base
  - `full`: golden lid jar, glowing amber fill, sparkle stars (completed state)
- No external image dependency — pure SVG

---

## 3. Navigation Architecture

### Mobile (< 768px / `md` breakpoint)
- Global `SiteHeader` hidden
- Each page renders its own internal page header (see PageHeader above)
- `BottomNav` fixed at bottom, always visible on authenticated pages
- Page content has `pb-20` to avoid overlap with bottom nav

### Desktop (≥ 768px)
- `SiteHeader` visible at top
- `BottomNav` hidden
- Page layout unchanged structurally, just recolored

---

## 4. Page-by-Page Changes

### `/` — Landing
- Background: `--wj-cream`
- Hero section: plum CTA button ("Create your first jar"), `JarIllustration variant="partial"` replacing the preview card
- Categories grid: cream cards, plum hover border
- No bottom nav (unauthenticated)

### `/login` & `/signup`
- Centered card on cream background
- Plum submit button
- Rounded inputs with `--wj-card-border` border
- No bottom nav (unauthenticated)

### `/setup/username`
- Same treatment as login/signup

### `/dashboard` → repurposed as **Home / Timeline** screen
- **Mobile page header**: AvatarCircle + "Hi, [name]" + "N wishes are growing today" + notification bell (static UI, no real notifications yet)
- Tab filter pills: All | Jars | Posts | Complete (client-side filter, no new DB queries)
- Two quick action buttons: "Create Jar" (gold, full rounded) + "Share Profile" (cream/outlined)
- Content: list of `JarCard` components from followed jars + user's own jars
  - Source: existing jars query from Supabase (user's own jars) — following feed deferred to future
  - Completed jars render as gold `JarCard` variant
- No sidebar on mobile; desktop retains 2-column layout

### `/feed`
- Same `JarCard` list
- Trending sidebar: hidden on mobile (`hidden md:block`), shown on desktop
- Page header on mobile: "Feed" title

### `/jars/[id]`
- Large `JarIllustration` (variant based on wish count / completion) at top of page on mobile
- Wish list below
- Plum action buttons (Edit, Add Wish, Complete Jar)

### `/jars/new` & `/jars/[id]/edit`
- Cream background
- Rounded inputs (`rounded-xl`, `--wj-card-border`)
- Plum submit button

### `/jars/[id]/wishes/new` & `/jars/[id]/wishes/[wishId]/edit`
- Same form treatment

### `/u/[username]`
- Large `AvatarCircle` (lg) at top
- Jar grid: `JarCard` or compact jar tiles
- On mobile: stacked single column

### `/settings/profile`
- Form page, cream background, plum save button

### `/privacy` & `/terms`
- Cream background, plum heading, no structural change

---

## 5. Implementation Order

1. Design tokens in `globals.css`
2. `AvatarCircle`, `ProgressBar`, `JarIllustration` components
3. `JarCard` component (uses above)
4. `BottomNav` component
5. Update `SiteHeader` (plum tokens, `hidden md:flex`)
6. Add `BottomNav` directly inside each authenticated page (not in `layout.tsx` — auth state not available there)
7. Redesign `/dashboard` as Timeline Home
8. Create `/jars` page (user's jar list, replaces dashboard sidebar)
9. Redesign `/feed`
10. Redesign `/jars/[id]`
11. Redesign all form pages (`/jars/new`, `/jars/[id]/edit`, wish forms)
12. Redesign `/u/[username]`
13. Redesign `/settings/profile`
14. Redesign `/login`, `/signup`, `/setup/username`
15. Redesign `/` landing
16. Redesign `/privacy`, `/terms`

---

## 6. BottomNav Visibility Rules

BottomNav renders **only** on authenticated app pages:
- `/dashboard`, `/jars`, `/jars/new`, `/jars/[id]`, `/jars/[id]/edit`, `/jars/[id]/wishes/*`
- `/feed`, `/settings/profile`, `/u/[username]`

BottomNav does **not** render on:
- `/` (landing), `/login`, `/signup`, `/setup/username`
- `/privacy`, `/terms`
- Any public jar view accessed without auth

**Future path:** Migrate to `src/app/(app)/layout.tsx` route group so BottomNav lives in a shared authenticated layout. Not in scope now.

---

## 7. Out of Scope

- Real push notifications (bell is decorative for now)
- Following system (JarCard "Followed" button is static UI)
- Dark mode
- Jar illustrations with animation
