# WishJar Mobile-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all WishJar pages to match the warm-cream mobile-first mockup with hybrid navigation (bottom nav on mobile, top nav on desktop).

**Architecture:** Establish Tailwind v4 design tokens in globals.css, build 5 shared components + update SiteHeader, then redesign all pages in dependency order. No DB schema changes — UI only.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase JS v2

## Global Constraints

- Tailwind v4: color tokens go in `@theme` block as `--color-wj-*`; use as `bg-wj-cream`, `text-wj-text`, etc.
- No new Supabase tables or columns
- BottomNav only on authenticated pages: `/dashboard`, `/jars`, `/jars/*`, `/feed`, `/u/[username]`, `/settings/profile`
- BottomNav NOT on: `/`, `/login`, `/signup`, `/setup/username`, `/privacy`, `/terms`
- No dark mode
- Dev server: `npm run dev` → http://localhost:3000
- After each task: run dev and visually verify in browser before committing

---

### Task 1: Design Tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utilities `bg-wj-cream`, `bg-wj-card`, `bg-wj-plum`, `bg-wj-gold`, `bg-wj-gold-light`, `bg-wj-gold-card`, `text-wj-text`, `text-wj-muted`, `text-wj-plum`, `text-wj-gold`, `border-wj-card-border`, `border-wj-plum`
- Also produces: CSS var `--wj-shadow` (used inline as `style={{ boxShadow: "var(--wj-shadow)" }}`)

- [ ] **Step 1: Replace entire globals.css**

```css
@import "tailwindcss";

:root {
  --wj-shadow: 0 2px 12px rgba(61,26,36,0.08);
}

@theme {
  --color-wj-cream: #F5EDD5;
  --color-wj-card: #FDFAF3;
  --color-wj-card-border: #E8DCBB;
  --color-wj-plum: #3D1A24;
  --color-wj-plum-mid: #6B2D40;
  --color-wj-gold: #C9973A;
  --color-wj-gold-light: #F0D080;
  --color-wj-gold-card: #EDD98A;
  --color-wj-text: #2C1A12;
  --color-wj-muted: #9B7E6A;
  --font-sans: var(--font-geist-sans);
}

body {
  background: #F5EDD5;
  color: #2C1A12;
  font-family: var(--font-geist-sans, Arial, Helvetica, sans-serif);
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

Open http://localhost:3000 — body background should be warm cream (#F5EDD5).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add WishJar design tokens to globals.css"
```

---

### Task 2: AvatarCircle and ProgressBar Components

**Files:**
- Create: `src/components/AvatarCircle.tsx`
- Create: `src/components/ProgressBar.tsx`

**Interfaces:**
- `AvatarCircle`: `{ name: string; size?: "sm" | "md" | "lg" }` → sm=w-8 h-8, md=w-10 h-10, lg=w-16 h-16
- `ProgressBar`: `{ value: number; label?: string }` → value 0–100, cream track, gold fill

- [ ] **Step 1: Create AvatarCircle.tsx**

```tsx
type Props = { name: string; size?: "sm" | "md" | "lg" };

const sizes = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

export default function AvatarCircle({ name, size = "md" }: Props) {
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-wj-plum`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
```

- [ ] **Step 2: Create ProgressBar.tsx**

```tsx
type Props = { value: number; label?: string };

export default function ProgressBar({ value, label }: Props) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-wj-card-border">
        <div
          className="h-2 rounded-full bg-wj-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <span className="text-xs font-semibold shrink-0 text-wj-text">{label}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AvatarCircle.tsx src/components/ProgressBar.tsx
git commit -m "feat: add AvatarCircle and ProgressBar components"
```

---

### Task 3: JarIllustration Component

**Files:**
- Create: `src/components/JarIllustration.tsx`

**Interfaces:**
- `JarIllustration`: `{ variant: "empty" | "partial" | "full"; size?: number }` → pure SVG, no external deps
- `empty`: silver lid, clear glass body, 2 paper scraps
- `partial`: same jar + more scraps + stars + gift box
- `full`: golden lid, amber fill, sparkle stars

- [ ] **Step 1: Create JarIllustration.tsx**

```tsx
type Props = { variant: "empty" | "partial" | "full"; size?: number };

function EmptyJar() {
  return (
    <>
      <rect x="22" y="5" width="36" height="11" rx="4" fill="#B8C4CC" />
      <rect x="16" y="14" width="48" height="7" rx="3" fill="#9AAAB4" />
      <rect x="12" y="19" width="56" height="56" rx="14" fill="#EBF5F9" />
      <rect x="12" y="19" width="56" height="56" rx="14" stroke="#C0D8E8" strokeWidth="1.5" />
      <rect x="18" y="25" width="7" height="22" rx="3.5" fill="white" opacity="0.5" />
      <g transform="rotate(-14 30 55)">
        <rect x="20" y="48" width="18" height="13" rx="2" fill="white" />
        <line x1="24" y1="53" x2="35" y2="53" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="24" y1="57" x2="30" y2="57" stroke="#E0E0E0" strokeWidth="1.5" />
      </g>
      <g transform="rotate(8 46 58)">
        <rect x="38" y="52" width="14" height="10" rx="2" fill="#F9F9F9" />
        <line x1="41" y1="57" x2="49" y2="57" stroke="#E0E0E0" strokeWidth="1.5" />
      </g>
    </>
  );
}

function PartialJar() {
  return (
    <>
      <rect x="22" y="5" width="36" height="11" rx="4" fill="#B8C4CC" />
      <rect x="16" y="14" width="48" height="7" rx="3" fill="#9AAAB4" />
      <rect x="12" y="19" width="56" height="56" rx="14" fill="#EBF5F9" />
      <rect x="12" y="19" width="56" height="56" rx="14" stroke="#C0D8E8" strokeWidth="1.5" />
      <rect x="18" y="25" width="7" height="22" rx="3.5" fill="white" opacity="0.5" />
      <g transform="rotate(-14 30 55)">
        <rect x="19" y="47" width="18" height="13" rx="2" fill="white" />
        <line x1="23" y1="52" x2="34" y2="52" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="23" y1="56" x2="29" y2="56" stroke="#E0E0E0" strokeWidth="1.5" />
      </g>
      <g transform="rotate(10 46 57)">
        <rect x="37" y="50" width="16" height="12" rx="2" fill="#FFF8F0" />
        <line x1="40" y1="55" x2="50" y2="55" stroke="#E8D8C0" strokeWidth="1.5" />
      </g>
      <g transform="rotate(-5 40 36)">
        <rect x="28" y="30" width="14" height="10" rx="2" fill="white" opacity="0.85" />
      </g>
      <text x="56" y="18" fontSize="10" fill="#F5C842">★</text>
      <text x="7" y="22" fontSize="7" fill="#F5C842">★</text>
      <text x="61" y="34" fontSize="7" fill="#F5C842">✦</text>
      <rect x="46" y="62" width="14" height="11" rx="2" fill="#E8A0B0" />
      <rect x="44" y="60" width="18" height="4" rx="1" fill="#D07080" />
      <line x1="53" y1="60" x2="53" y2="73" stroke="#D07080" strokeWidth="1.5" />
    </>
  );
}

function FullJar() {
  return (
    <>
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="65%" r="50%">
          <stop offset="0%" stopColor="#F5C842" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F5C842" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="22" y="5" width="36" height="11" rx="4" fill="#D4A843" />
      <rect x="16" y="14" width="48" height="7" rx="3" fill="#B88A2A" />
      <rect x="12" y="19" width="56" height="56" rx="14" fill="#FDE8A0" />
      <rect x="12" y="19" width="56" height="56" rx="14" fill="url(#goldGlow)" />
      <rect x="12" y="19" width="56" height="56" rx="14" stroke="#C9973A" strokeWidth="1.5" />
      <rect x="18" y="25" width="7" height="22" rx="3.5" fill="white" opacity="0.4" />
      <circle cx="32" cy="58" r="7" fill="#D4A843" opacity="0.8" />
      <circle cx="47" cy="61" r="5" fill="#C9973A" opacity="0.7" />
      <circle cx="38" cy="66" r="6" fill="#E0B84A" opacity="0.6" />
      <text x="55" y="17" fontSize="12" fill="#F5C842">★</text>
      <text x="6" y="20" fontSize="8" fill="#F5C842">★</text>
      <text x="61" y="32" fontSize="8" fill="#F5C842">✦</text>
      <text x="4" y="40" fontSize="10" fill="#F5C842">✦</text>
      <text x="59" y="52" fontSize="7" fill="#F5C842">★</text>
    </>
  );
}

export default function JarIllustration({ variant, size = 80 }: Props) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {variant === "empty" && <EmptyJar />}
      {variant === "partial" && <PartialJar />}
      {variant === "full" && <FullJar />}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JarIllustration.tsx
git commit -m "feat: add JarIllustration component with 3 SVG variants"
```

---

### Task 4: JarCard Component

**Files:**
- Create: `src/components/JarCard.tsx`

**Interfaces:**
- Consumes: `AvatarCircle`, `ProgressBar`, `JarIllustration`
- Produces: `<JarCard jar={...} totalWishValue={1250} isOwn />`
- Props:
  ```tsx
  type JarCardProps = {
    jar: {
      id: string; title: string; description: string | null;
      category: string; goal_amount: number | null;
      status: string; username: string;
    };
    totalWishValue?: number;
    isOwn?: boolean;
  };
  ```

- [ ] **Step 1: Create JarCard.tsx**

```tsx
import AvatarCircle from "./AvatarCircle";
import ProgressBar from "./ProgressBar";
import JarIllustration from "./JarIllustration";

type JarCardProps = {
  jar: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    goal_amount: number | null;
    status: string;
    username: string;
  };
  totalWishValue?: number;
  isOwn?: boolean;
};

export default function JarCard({ jar, totalWishValue = 0, isOwn }: JarCardProps) {
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
        backgroundColor: isCompleted ? "var(--color-wj-gold-light, #F0D080)" : "var(--color-wj-card, #FDFAF3)",
        border: `1px solid ${isCompleted ? "#EDD98A" : "#E8DCBB"}`,
        boxShadow: "var(--wj-shadow)",
      }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-wj-muted">
          {isCompleted ? "Completed today" : "Jar update"}
        </span>
        <span className="text-wj-muted text-lg leading-none select-none">•••</span>
      </div>

      {/* Main content row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AvatarCircle name={jar.username} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-wj-text truncate">{jar.username}</p>
              <p className="text-xs text-wj-muted truncate">{jar.title}</p>
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
          <a
            href={`/jars/${jar.id}`}
            className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text border border-wj-gold bg-wj-gold-card"
          >
            View Jar
          </a>
        ) : (
          <>
            <a
              href={`/jars/${jar.id}`}
              className="flex-1 py-2 text-sm font-semibold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border"
            >
              {isOwn ? "View Jar" : "✓ Followed"}
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JarCard.tsx
git commit -m "feat: add JarCard component"
```

---

### Task 5: BottomNav Component + SiteHeader Update

**Files:**
- Create: `src/components/BottomNav.tsx`
- Modify: `src/components/SiteHeader.tsx`

**Interfaces:**
- `BottomNav`: `{ active?: "home" | "jars" | "create" | "profile" }` — renders null if not authenticated, hidden on `md:` and above
- `SiteHeader`: add `hidden md:block` wrapper, update colors to wj-plum

- [ ] **Step 1: Create BottomNav.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { active?: "home" | "jars" | "create" | "profile" };

export default function BottomNav({ active }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setReady(true); return; }
      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
      setUsername(profile?.username ?? null);
      setReady(true);
    };
    load();
  }, []);

  if (!ready || !username) return null;

  const navTab = (href: string, key: Props["active"], icon: React.ReactNode, label: string) => {
    const isActive = active === key;
    return (
      <a href={href} className="flex flex-col items-center gap-0.5 flex-1 py-2"
        style={{ color: isActive ? "#3D1A24" : "#9B7E6A" }}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </a>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-wj-card border-t border-wj-card-border">
      {navTab("/dashboard", "home", (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ), "Home")}

      {navTab("/jars", "jars", (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
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
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ), "Profile")}
    </nav>
  );
}
```

- [ ] **Step 2: Update SiteHeader.tsx**

Replace the entire file:

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = { activeTab?: "home" | "feed" | "profile" };

export default function SiteHeader({ activeTab }: Props) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
      setUsername(profile?.username ?? null);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const link = (href: string, label: string, tab?: Props["activeTab"]) => (
    <a
      href={href}
      className={`px-3 py-2 text-sm transition-colors ${
        activeTab === tab
          ? "border-b-2 border-wj-gold font-semibold text-wj-gold-card"
          : "text-white/70 hover:text-white"
      }`}
    >
      {label}
    </a>
  );

  return (
    <header className="hidden md:block bg-wj-plum border-b border-wj-plum-mid">
      <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5 shrink-0" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#EDD98A"/>
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#6B2D40"/>
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="#EDD98A"/>
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </a>
          <nav className="flex items-center">
            {link("/dashboard", "Home", "home")}
            {link("/feed", "Feed", "feed")}
            {username && link(`/u/${username}`, `@${username}`, "profile")}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {username && (
            <a href="/settings/profile" className="text-white/60 hover:text-white">Settings</a>
          )}
          <button onClick={handleLogout} className="text-white/60 hover:text-white">Sign out</button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav.tsx src/components/SiteHeader.tsx
git commit -m "feat: add BottomNav, update SiteHeader to plum theme and mobile-hidden"
```

---

### Task 6: Dashboard → Timeline Home

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `JarCard`, `BottomNav`, `SiteHeader`
- Data: loads user jars + wish value sums per jar from Supabase

- [ ] **Step 1: Replace dashboard/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; created_at: string;
};
type Tab = "all" | "jars" | "posts" | "complete";
const MAX_JARS = 3;

export default function DashboardPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [totalWishes, setTotalWishes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", userData.user.id).single();
      setUsername(profile?.username ?? null);

      const { data: jarsData } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      const jarsArr = jarsData ?? [];
      setJars(jarsArr);

      if (jarsArr.length > 0) {
        const jarIds = jarsArr.map((j) => j.id);
        const { data: wishes } = await supabase
          .from("wishes").select("jar_id, price").in("jar_id", jarIds);
        const valueMap: Record<string, number> = {};
        let count = 0;
        (wishes ?? []).forEach((w) => {
          valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0);
          count++;
        });
        setWishValueMap(valueMap);
        setTotalWishes(count);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredJars = jars.filter((j) => {
    if (tab === "jars") return j.status !== "completed";
    if (tab === "complete") return j.status === "completed";
    return true;
  });

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = activeJars.length >= MAX_JARS;

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

      {/* Mobile page header */}
      <div className="md:hidden px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white bg-wj-plum shrink-0">
              {username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-wj-text">Hi, {username} 👋</h1>
              <p className="text-xs text-wj-muted">
                {totalWishes} {totalWishes === 1 ? "wish" : "wishes"} are growing today
              </p>
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-wj-card border border-wj-card-border"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-wj-text" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wj-plum-mid"></span>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3 mb-4">
          {!atLimit ? (
            <a href="/jars/new"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-gold-card border border-wj-gold">
              🫙 Create Jar
            </a>
          ) : (
            <span className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-gold-card border border-wj-gold opacity-40">
              🫙 Limit Reached
            </span>
          )}
          <a href={username ? `/u/${username}` : "#"}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-wj-text bg-wj-card border border-wj-card-border">
            👥 Share Profile
          </a>
        </div>

        {/* Tab pills */}
        <div className="flex items-center rounded-2xl p-1 gap-1 bg-wj-card border border-wj-card-border">
          {(["all", "jars", "posts", "complete"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
              style={{
                backgroundColor: tab === t ? "#3D1A24" : "transparent",
                color: tab === t ? "white" : "#9B7E6A",
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop header row */}
      <div className="hidden md:flex mx-auto max-w-5xl px-4 pt-6 pb-2 items-center justify-between">
        <h1 className="text-xl font-bold text-wj-text">Your Timeline</h1>
        {!atLimit && (
          <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">
            + New jar
          </a>
        )}
      </div>

      {/* Jar cards */}
      <div className="px-4 md:mx-auto md:max-w-5xl">
        {tab === "posts" ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted">
              Posts feed coming soon — check the{" "}
              <a href="/feed" className="underline text-wj-plum">Community Feed</a>
            </p>
          </div>
        ) : filteredJars.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-wj-muted mb-4">
              {tab === "complete" ? "No completed jars yet." : "You haven't created any jars yet."}
            </p>
            {!atLimit && tab !== "complete" && (
              <a href="/jars/new" className="inline-block px-6 py-3 rounded-2xl text-sm font-bold text-white bg-wj-plum">
                Create your first jar
              </a>
            )}
          </div>
        ) : (
          filteredJars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={{ ...jar, username: username ?? "You" }}
              totalWishValue={wishValueMap[jar.id] ?? 0}
              isOwn
            />
          ))
        )}
      </div>

      <footer className="hidden md:block mt-10 border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-wj-muted">
          <span>© 2026 WishJar</span>
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

- [ ] **Step 2: Run dev and verify**

Go to http://localhost:3000/dashboard — mobile view should show greeting header, action buttons, tab pills, JarCards. Desktop shows top nav + timeline header.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: redesign dashboard as Timeline Home with mobile header and JarCards"
```

---

### Task 7: New /jars Page

**Files:**
- Create: `src/app/jars/page.tsx`

**Interfaces:**
- Consumes: `BottomNav`, `SiteHeader`
- Linked from BottomNav "Jars" tab

- [ ] **Step 1: Create src/app/jars/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; created_at: string;
};
const MAX_JARS = 3;

export default function JarsPage() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, status, created_at")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setJars(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const activeJars = jars.filter((j) => j.status !== "completed");
  const atLimit = activeJars.length >= MAX_JARS;

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

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wj-text">My Jars</h1>
          <p className="text-xs text-wj-muted mt-0.5">{activeJars.length}/{MAX_JARS} active</p>
        </div>
        {!atLimit && (
          <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">+ New</a>
        )}
      </div>

      <div className="px-4 md:mx-auto md:max-w-5xl md:py-6">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-wj-text">
            My Jars
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-wj-card text-wj-muted">
              {activeJars.length}/{MAX_JARS}
            </span>
          </h1>
          {!atLimit && (
            <a href="/jars/new" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">+ New jar</a>
          )}
        </div>

        {jars.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🫙</div>
            <p className="text-sm text-wj-muted mb-4">No jars yet. Create your first one!</p>
            <a href="/jars/new" className="inline-block px-6 py-3 rounded-2xl text-sm font-bold text-white bg-wj-plum">
              Create jar
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {jars.map((jar) => (
              <a
                key={jar.id}
                href={`/jars/${jar.id}`}
                className="block rounded-2xl p-4"
                style={{
                  backgroundColor: jar.status === "completed" ? "#F0D080" : "#FDFAF3",
                  border: `1px solid ${jar.status === "completed" ? "#EDD98A" : "#E8DCBB"}`,
                  boxShadow: "var(--wj-shadow)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base font-bold text-wj-text">{jar.title}</span>
                      {jar.status === "completed" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-wj-gold">Done</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
                      {jar.goal_amount && (
                        <span className="text-xs text-wj-muted">Goal: ${jar.goal_amount.toLocaleString()}</span>
                      )}
                    </div>
                    {jar.description && (
                      <p className="mt-1.5 text-xs text-wj-muted line-clamp-1">{jar.description}</p>
                    )}
                  </div>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5 text-wj-muted" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}

        {atLimit && (
          <p className="mt-4 text-xs text-center text-wj-muted">
            {activeJars.length} active jars (max {MAX_JARS}). Complete or delete one to create more.
          </p>
        )}
      </div>

      <BottomNav active="jars" />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Go to http://localhost:3000/jars — should show jar list with cream cards and plum "New" button.

- [ ] **Step 3: Commit**

```bash
git add src/app/jars/page.tsx
git commit -m "feat: create /jars page for user jar list (BottomNav Jars tab)"
```

---

### Task 8: Feed Page Redesign

**Files:**
- Modify: `src/app/feed/page.tsx`

**Interfaces:**
- Consumes: `JarCard`, `AvatarCircle`, `BottomNav`, `SiteHeader`
- Also fetches wish price sums for trending jars to display progress

- [ ] **Step 1: Replace feed/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import JarCard from "@/components/JarCard";
import AvatarCircle from "@/components/AvatarCircle";
import BottomNav from "@/components/BottomNav";

type FeedJar = {
  id: string; title: string; description: string | null;
  category: string; goal_amount: number | null;
  status: string; username: string;
};
type Post = {
  id: string; user_id: string; jar_id: string | null; content: string;
  created_at: string; username: string; jar_title: string | null;
};

export default function FeedPage() {
  const [feedJars, setFeedJars] = useState<FeedJar[]>([]);
  const [wishValueMap, setWishValueMap] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }

      const { data: allJars } = await supabase
        .from("jars")
        .select("id, title, description, category, goal_amount, user_id")
        .eq("status", "active")
        .neq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (allJars && allJars.length > 0) {
        const jarIds = allJars.map((j) => j.id);
        const ownerIds = [...new Set(allJars.map((j) => j.user_id))];
        const [{ data: wishData }, { data: jarProfiles }] = await Promise.all([
          supabase.from("wishes").select("jar_id, price").in("jar_id", jarIds),
          supabase.from("profiles").select("id, username").in("id", ownerIds),
        ]);

        const countMap: Record<string, number> = {};
        const valueMap: Record<string, number> = {};
        (wishData ?? []).forEach((w) => {
          countMap[w.jar_id] = (countMap[w.jar_id] ?? 0) + 1;
          valueMap[w.jar_id] = (valueMap[w.jar_id] ?? 0) + (w.price ?? 0);
        });
        setWishValueMap(valueMap);

        const profileMap = Object.fromEntries((jarProfiles ?? []).map((p) => [p.id, p.username]));
        const trending: FeedJar[] = allJars
          .map((j) => ({
            id: j.id, title: j.title, description: j.description ?? null,
            category: j.category, goal_amount: j.goal_amount,
            status: "active", username: profileMap[j.user_id] ?? "?",
          }))
          .sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0))
          .slice(0, 8);
        setFeedJars(trending);
      }

      const { data: rawPosts } = await supabase
        .from("posts").select("id, user_id, jar_id, content, created_at")
        .order("created_at", { ascending: false }).limit(50);

      if (rawPosts && rawPosts.length > 0) {
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const jarIds2 = rawPosts.filter((p) => p.jar_id).map((p) => p.jar_id as string);
        const [{ data: profiles }, { data: jars }] = await Promise.all([
          supabase.from("profiles").select("id, username").in("id", userIds),
          jarIds2.length > 0 ? supabase.from("jars").select("id, title").in("id", jarIds2) : Promise.resolve({ data: [] }),
        ]);
        const pMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
        const jMap = Object.fromEntries((jars ?? []).map((j) => [j.id, j.title]));
        setPosts(rawPosts.map((p) => ({
          ...p, username: pMap[p.user_id] ?? "unknown",
          jar_title: p.jar_id ? (jMap[p.jar_id] ?? null) : null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-wj-cream">
        <SiteHeader activeTab="feed" />
        <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading feed…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="feed" />

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-wj-text">Community Feed</h1>
        <p className="text-xs text-wj-muted mt-0.5">Discover what others are wishing for</p>
      </div>

      <div className="md:mx-auto md:max-w-5xl md:px-4 md:py-6 md:grid md:gap-5 md:grid-cols-[1fr_260px]">
        {/* Main: trending jars as JarCards */}
        <div className="px-4 md:px-0">
          {feedJars.length === 0 && posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-wj-muted">No community jars yet. Be the first to create one!</p>
            </div>
          ) : (
            <>
              {feedJars.map((jar) => (
                <JarCard key={jar.id} jar={jar} totalWishValue={wishValueMap[jar.id] ?? 0} />
              ))}

              {posts.length > 0 && (
                <div className="mt-2">
                  <h2 className="text-sm font-bold text-wj-text mb-3">Community Posts</h2>
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <AvatarCircle name={post.username} size="sm" />
                          <div>
                            <a href={`/u/${post.username}`} className="text-sm font-semibold text-wj-plum hover:underline">
                              @{post.username}
                            </a>
                            <span className="ml-2 text-xs text-wj-muted">{timeAgo(post.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-wj-text leading-relaxed">{post.content}</p>
                        {post.jar_title && post.jar_id && (
                          <a href={`/jars/${post.jar_id}`} className="mt-2 inline-block text-xs text-wj-plum hover:underline">
                            → {post.jar_title}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block space-y-4">
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h2 className="text-sm font-bold text-wj-text mb-3">Trending Jars</h2>
            {feedJars.slice(0, 5).map((jar) => (
              <a key={jar.id} href={`/jars/${jar.id}`} className="flex items-center gap-2 py-2 border-b border-wj-card-border last:border-0 hover:opacity-70">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-wj-plum shrink-0">
                  {jar.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-wj-text truncate">{jar.title}</p>
                  <p className="text-xs text-wj-muted">@{jar.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/feed/page.tsx
git commit -m "feat: redesign feed page with JarCards and cream palette"
```

---

### Task 9: Jar Detail Page Redesign

**Files:**
- Modify: `src/app/jars/[id]/page.tsx`

**Interfaces:**
- Consumes: `JarIllustration`, `ProgressBar`, `BottomNav`, `SiteHeader`

- [ ] **Step 1: Replace jars/[id]/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import JarIllustration from "@/components/JarIllustration";
import ProgressBar from "@/components/ProgressBar";
import BottomNav from "@/components/BottomNav";

type Jar = {
  id: string; title: string; description: string | null; category: string;
  goal_amount: number | null; created_at: string; user_id: string; status: string;
};
type Wish = {
  id: string; title: string; description: string | null;
  product_url: string | null; price: number | null; created_at: string;
};

export default function JarDetailPage() {
  const params = useParams();
  const jarId = params.id as string;
  const [jar, setJar] = useState<Jar | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data, error } = await supabase
        .from("jars").select("id, title, description, category, goal_amount, created_at, user_id, status")
        .eq("id", jarId).single();
      if (error || !data) { setMessage("Jar not found."); setLoading(false); return; }
      setJar(data);
      setIsOwner(data.user_id === userData.user.id);
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user_id).single();
      setOwnerUsername(profile?.username ?? null);
      const { data: wishesData } = await supabase
        .from("wishes").select("id, title, description, product_url, price, created_at")
        .eq("jar_id", jarId).order("created_at", { ascending: false });
      setWishes(wishesData ?? []);
      setLoading(false);
    };
    load();
  }, [jarId]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteWish = async (wishId: string) => {
    if (!confirm("Remove this wish item?")) return;
    setDeletingId(wishId);
    const { error } = await supabase.from("wishes").delete().eq("id", wishId);
    if (error) { setMessage(error.message); setDeletingId(null); return; }
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
    setDeletingId(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading jar…</div>
    </div>
  );

  if (!jar) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-red-600">{message || "Jar not found."}</p>
        <a href="/dashboard" className="mt-3 inline-block text-sm text-wj-plum hover:underline">← Back to Home</a>
      </div>
    </div>
  );

  const totalWishValue = wishes.reduce((s, w) => s + (w.price ?? 0), 0);
  const progressPct = jar.goal_amount && jar.goal_amount > 0
    ? Math.min(Math.round((totalWishValue / jar.goal_amount) * 100), 100) : 0;
  const illustrationVariant = jar.status === "completed" ? "full" : wishes.length > 0 ? "partial" : "empty";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      {/* Mobile hero */}
      <div className="md:hidden" style={{ background: jar.status === "completed" ? "#F0D080" : "#FDFAF3", borderBottom: "1px solid #E8DCBB" }}>
        <div className="px-4 pt-5 pb-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <a href="/jars" className="text-xs text-wj-muted mb-2 inline-block">← My Jars</a>
            <h1 className="text-2xl font-bold text-wj-text mb-1">{jar.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
            {ownerUsername && (
              <p className="mt-1 text-xs text-wj-muted">
                by <a href={`/u/${ownerUsername}`} className="text-wj-plum hover:underline">@{ownerUsername}</a>
              </p>
            )}
            {jar.goal_amount && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-wj-muted">${totalWishValue.toLocaleString()} / ${jar.goal_amount.toLocaleString()}</span>
                  <span className="font-semibold text-wj-text">{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} />
              </div>
            )}
          </div>
          <JarIllustration variant={illustrationVariant} size={90} />
        </div>
        {isOwner && (
          <div className="px-4 pb-4 flex gap-2">
            <a href={`/jars/${jar.id}/wishes/new`}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-white bg-wj-plum">
              + Add Wish
            </a>
            <a href={`/jars/${jar.id}/edit`}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
              Edit Jar
            </a>
            <button onClick={handleCopyLink}
              className="flex-1 py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        )}
      </div>

      <div className="md:mx-auto md:max-w-5xl md:px-4 md:py-6 md:grid md:gap-5 md:grid-cols-[1fr_260px]">
        {/* Wish list */}
        <div className="px-4 pt-4 md:px-0 md:pt-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-wj-text">
              Wish Items
              <span className="ml-2 text-sm font-normal text-wj-muted">({wishes.length})</span>
            </h2>
            {isOwner && (
              <a href={`/jars/${jar.id}/wishes/new`}
                className="hidden md:inline-block px-4 py-2 rounded-xl text-sm font-bold text-white bg-wj-plum">
                + Add item
              </a>
            )}
          </div>

          {wishes.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-wj-card border border-wj-card-border">
              <p className="text-sm text-wj-muted">No wish items yet.</p>
              {isOwner && (
                <a href={`/jars/${jar.id}/wishes/new`} className="mt-2 inline-block text-sm text-wj-plum hover:underline">
                  Add your first item
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {wishes.map((wish) => (
                <div key={wish.id} className="rounded-2xl p-4 bg-wj-card border border-wj-card-border flex items-start justify-between" style={{ boxShadow: "var(--wj-shadow)" }}>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-wj-text">{wish.title}</p>
                    {wish.description && <p className="mt-0.5 text-xs text-wj-muted">{wish.description}</p>}
                    {wish.product_url && (
                      <a href={wish.product_url} target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-xs text-wj-plum hover:underline">
                        View product →
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {wish.price !== null && (
                      <span className="text-sm font-bold text-wj-text">${wish.price.toLocaleString()}</span>
                    )}
                    {isOwner && (
                      <div className="flex gap-1.5">
                        <a href={`/jars/${jar.id}/wishes/${wish.id}/edit`}
                          className="rounded-lg border border-wj-card-border px-2 py-0.5 text-xs text-wj-text hover:bg-wj-cream">
                          Edit
                        </a>
                        <button onClick={() => handleDeleteWish(wish.id)} disabled={deletingId === wish.id}
                          className="rounded-lg border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                          {deletingId === wish.id ? "…" : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && <p className="mt-3 text-xs text-red-600">{message}</p>}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block space-y-4">
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <div className="flex justify-center mb-3">
              <JarIllustration variant={illustrationVariant} size={100} />
            </div>
            <h1 className="text-base font-bold text-wj-text mb-1">{jar.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
            {jar.description && <p className="mt-2 text-xs text-wj-muted leading-5">{jar.description}</p>}
            {jar.goal_amount && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-wj-muted">${totalWishValue.toLocaleString()} / ${jar.goal_amount.toLocaleString()}</span>
                  <span className="font-semibold text-wj-text">{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} />
              </div>
            )}
            {isOwner && (
              <div className="mt-3 space-y-2">
                <a href={`/jars/${jar.id}/wishes/new`}
                  className="block w-full py-2.5 text-sm font-bold text-center rounded-xl text-white bg-wj-plum">
                  + Add Wish Item
                </a>
                <a href={`/jars/${jar.id}/edit`}
                  className="block w-full py-2.5 text-sm font-bold text-center rounded-xl text-wj-text bg-wj-card border border-wj-card-border">
                  Edit Jar
                </a>
              </div>
            )}
          </div>
          <div className="rounded-2xl p-4 bg-wj-card border border-wj-card-border" style={{ boxShadow: "var(--wj-shadow)" }}>
            <h3 className="text-xs font-semibold text-wj-muted uppercase tracking-wide mb-3">Share this jar</h3>
            <div className="mb-3 rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2 text-xs text-wj-muted break-all">
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>
            <button onClick={handleCopyLink}
              className="w-full py-2 rounded-xl text-xs font-bold text-wj-plum border border-wj-plum hover:bg-wj-cream">
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/jars/[id]/page.tsx
git commit -m "feat: redesign jar detail page with JarIllustration and cream palette"
```

---

### Task 10: Form Pages Redesign

**Files:**
- Modify: `src/app/jars/new/page.tsx`
- Modify: `src/app/jars/[id]/edit/page.tsx`
- Modify: `src/app/jars/[id]/wishes/new/page.tsx`
- Modify: `src/app/jars/[id]/wishes/[wishId]/edit/page.tsx`

**Interfaces:**
- All four follow the same pattern: cream bg, rounded-2xl card, rounded-xl inputs with `border-wj-card-border`, plum submit button, BottomNav
- Logic (Supabase calls, validation) is unchanged — only markup/styling changes

Shared input class: `w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text`
Shared label class: `mb-1 block text-xs font-semibold text-wj-text`
Shared submit button class: `rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60`
Shared cancel link class: `text-sm text-wj-muted hover:text-wj-text`
Shared card wrapper: `rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4` with `boxShadow: "var(--wj-shadow)"`

- [ ] **Step 1: Replace jars/new/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

const categories = ["New Home","Wedding","Baby","Birthday","Travel","Education","Gaming","Startup","Charity","Other"];

export default function NewJarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("New Home");
  const [goalAmount, setGoalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
      setUserId(data.user.id);
    });
  }, []);

  const handleCreate = async () => {
    if (!userId) { setMessage("You must be logged in."); return; }
    if (!title.trim()) { setMessage("Jar name is required."); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.from("jars").insert({
      user_id: userId, title: sanitizeText(title, 200), category,
      goal_amount: goalAmount ? Number(goalAmount) : null,
      description: sanitizeText(description, 1000) || null,
    });
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    window.location.href = "/jars";
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href="/jars" className="text-xs text-wj-muted">← My Jars</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Create Jar</h1>
        </div>
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="hidden md:block border-b border-wj-card-border pb-3 mb-1">
            <h1 className="text-base font-bold text-wj-text">Create a new jar</h1>
            <p className="mt-0.5 text-xs text-wj-muted">Give your jar a name and set a goal.</p>
          </div>
          <div>
            <label className={labelCls}>Jar name <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Apartment" maxLength={200} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Goal amount <span className="text-wj-muted font-normal">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wj-muted">$</span>
              <input type="number" min="0" step="0.01" value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)} placeholder="1000"
                className={`${inputCls} pl-7`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this jar is for." rows={4} maxLength={1000}
              className={inputCls} />
          </div>
          {message && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleCreate} disabled={saving}
              className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {saving ? "Creating…" : "Create Jar"}
            </button>
            <a href="/jars" className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
          </div>
        </div>
      </div>
      <BottomNav active="create" />
    </div>
  );
}
```

- [ ] **Step 2: Read and replace jars/[id]/edit/page.tsx**

Read the current file first: `src/app/jars/[id]/edit/page.tsx`

Then apply the same styling pattern: same input/label/button classes as above, replace `bg-[#f0eeea]` with `bg-wj-cream`, replace violet accents with plum, use rounded-2xl card, add `<BottomNav />`, change cancel link to `/jars/${jarId}`.

- [ ] **Step 3: Replace jars/[id]/wishes/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { isValidUrl, sanitizeText, isValidPrice } from "@/lib/validate";

export default function NewWishPage() {
  const params = useParams();
  const router = useRouter();
  const jarId = params.id as string;
  const [title, setTitle] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateWish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setErrorMessage("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setErrorMessage("You must be logged in."); setLoading(false); return; }
    if (productUrl && !isValidUrl(productUrl)) { setErrorMessage("Invalid product URL (must start with http:// or https://)."); setLoading(false); return; }
    if (price && !isValidPrice(price)) { setErrorMessage("Invalid price."); setLoading(false); return; }
    const { error } = await supabase.from("wishes").insert({
      jar_id: jarId, user_id: user.id, title: sanitizeText(title, 200),
      product_url: productUrl ? sanitizeText(productUrl, 2000) : null,
      price: price ? Number(price) : null,
      description: description ? sanitizeText(description, 1000) : null,
    });
    if (error) { setErrorMessage(error.message); setLoading(false); return; }
    router.push(`/jars/${jarId}`);
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="home" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href={`/jars/${jarId}`} className="text-xs text-wj-muted">← Back to Jar</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Add Wish Item</h1>
        </div>
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="hidden md:block border-b border-wj-card-border pb-3 mb-4">
            <h1 className="text-base font-bold text-wj-text">Add a wish item</h1>
            <p className="mt-0.5 text-xs text-wj-muted">Add a product, goal, or item to this jar.</p>
          </div>
          <form onSubmit={handleCreateWish} className="space-y-4">
            <div>
              <label className={labelCls}>Item name <span className="text-red-500">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder="e.g. PlayStation 5" maxLength={200} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Product link <span className="text-wj-muted font-normal">(optional)</span></label>
              <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price <span className="text-wj-muted font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wj-muted">$</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  type="number" min="0" step="0.01" placeholder="499" className={`${inputCls} pl-7`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-wj-muted font-normal">(optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this item matters…" rows={3} maxLength={1000} className={inputCls} />
            </div>
            {errorMessage && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>}
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
                {loading ? "Adding…" : "Add Item"}
              </button>
              <a href={`/jars/${jarId}`} className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
            </div>
          </form>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 4: Read and replace jars/[id]/wishes/[wishId]/edit/page.tsx**

Read the current file: `src/app/jars/[id]/wishes/[wishId]/edit/page.tsx`

Apply same styling as Step 3 (same input/label/button classes), add `<BottomNav />`, replace all violet/gray with wj tokens.

- [ ] **Step 5: Commit**

```bash
git add src/app/jars/new/page.tsx src/app/jars/[id]/edit/page.tsx src/app/jars/[id]/wishes/new/page.tsx src/app/jars/[id]/wishes/[wishId]/edit/page.tsx
git commit -m "feat: redesign all form pages with cream palette and rounded inputs"
```

---

### Task 11: Profile, Settings, Auth, Landing, Legal Pages

**Files:**
- Modify: `src/app/u/[username]/page.tsx`
- Modify: `src/app/settings/profile/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/setup/username/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`

**Interfaces:**
- Profile page consumes `AvatarCircle`, `BottomNav`
- Auth pages: no BottomNav, inline plum header
- Landing: no BottomNav, uses `JarIllustration`

- [ ] **Step 1: Replace u/[username]/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import AvatarCircle from "@/components/AvatarCircle";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

type Profile = { id: string; username: string; bio: string | null; created_at: string; };
type Jar = { id: string; title: string; description: string | null; category: string; goal_amount: number | null; };
type Post = { id: string; content: string; jar_id: string | null; jar_title: string | null; created_at: string; };

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "jars">("posts");
  const [postContent, setPostContent] = useState("");
  const [postJarId, setPostJarId] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      setCurrentUserId(userData.user.id);
      const { data: profileData } = await supabase.from("profiles").select("id, username, bio, created_at").eq("username", username).single();
      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);
      const [{ data: jarsData }, { data: rawPosts }] = await Promise.all([
        supabase.from("jars").select("id, title, description, category, goal_amount").eq("user_id", profileData.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("id, content, jar_id, created_at").eq("user_id", profileData.id).order("created_at", { ascending: false }),
      ]);
      setJars(jarsData ?? []);
      const jarMap = Object.fromEntries((jarsData ?? []).map((j) => [j.id, j.title]));
      setPosts((rawPosts ?? []).map((p) => ({ ...p, jar_title: p.jar_id ? (jarMap[p.jar_id] ?? null) : null })));
      setLoading(false);
    };
    load();
  }, [username]);

  const handlePost = async () => {
    const content = sanitizeText(postContent, 500);
    if (!content) return;
    setPosting(true); setPostError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: inserted, error } = await supabase.from("posts")
      .insert({ user_id: userData.user.id, content, jar_id: postJarId || null })
      .select("id, content, jar_id, created_at").single();
    setPosting(false);
    if (error) { setPostError(error.message); return; }
    const jarMap = Object.fromEntries(jars.map((j) => [j.id, j.title]));
    setPosts((prev) => [{ ...inserted, jar_title: inserted.jar_id ? (jarMap[inserted.jar_id] ?? null) : null }, ...prev]);
    setPostContent(""); setPostJarId("");
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-wj-muted">User not found.</p>
      </div>
    </div>
  );

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader activeTab="profile" />

      {/* Profile header */}
      <div className="px-4 pt-6 pb-4 md:mx-auto md:max-w-5xl">
        <div className="flex items-start gap-4 mb-4">
          <AvatarCircle name={profile.username} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-wj-text">@{profile.username}</h1>
            {profile.bio && <p className="text-sm text-wj-muted mt-1">{profile.bio}</p>}
            <p className="text-xs text-wj-muted mt-1">Joined {timeAgo(profile.created_at)}</p>
          </div>
          {isOwnProfile && (
            <a href="/settings/profile"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-wj-text bg-wj-card border border-wj-card-border">
              Edit
            </a>
          )}
        </div>

        {/* Tab pills */}
        <div className="flex gap-1 p-1 rounded-2xl bg-wj-card border border-wj-card-border">
          {(["posts", "jars"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
              style={{ backgroundColor: activeTab === t ? "#3D1A24" : "transparent", color: activeTab === t ? "white" : "#9B7E6A" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:mx-auto md:max-w-5xl">
        {activeTab === "posts" && (
          <div className="space-y-3">
            {isOwnProfile && (
              <div className="rounded-2xl bg-wj-card border border-wj-card-border p-4" style={{ boxShadow: "var(--wj-shadow)" }}>
                <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share an update about your jars…" rows={3} maxLength={500}
                  className="w-full rounded-xl border border-wj-card-border bg-wj-cream px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text resize-none" />
                {jars.length > 0 && (
                  <select value={postJarId} onChange={(e) => setPostJarId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2 text-xs text-wj-text outline-none">
                    <option value="">No jar</option>
                    {jars.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                )}
                {postError && <p className="mt-2 text-xs text-red-600">{postError}</p>}
                <div className="mt-2 flex justify-end">
                  <button onClick={handlePost} disabled={posting || !postContent.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-wj-plum disabled:opacity-50">
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}
            {posts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-wj-muted">No posts yet.</p>
              </div>
            ) : posts.map((post) => (
              <div key={post.id} className="rounded-2xl bg-wj-card border border-wj-card-border p-4" style={{ boxShadow: "var(--wj-shadow)" }}>
                <p className="text-sm text-wj-text leading-relaxed">{post.content}</p>
                {post.jar_title && post.jar_id && (
                  <a href={`/jars/${post.jar_id}`} className="mt-1 inline-block text-xs text-wj-plum hover:underline">
                    → {post.jar_title}
                  </a>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-wj-muted">{timeAgo(post.created_at)}</span>
                  {isOwnProfile && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "jars" && (
          <div className="space-y-3">
            {jars.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-wj-muted">No jars yet.</p>
              </div>
            ) : jars.map((jar) => (
              <a key={jar.id} href={`/jars/${jar.id}`}
                className="block rounded-2xl bg-wj-card border border-wj-card-border p-4" style={{ boxShadow: "var(--wj-shadow)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-wj-text">{jar.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-wj-cream text-wj-muted">{jar.category}</span>
                    {jar.description && <p className="mt-1 text-xs text-wj-muted line-clamp-1">{jar.description}</p>}
                  </div>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-wj-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
```

- [ ] **Step 2: Replace settings/profile/page.tsx**

Read the current file, keep all logic, replace only styling. Key changes:
- `bg-[#f0eeea]` → `bg-wj-cream`
- White bordered card → `rounded-2xl bg-wj-card border border-wj-card-border`
- Gray bordered inputs → `rounded-xl border border-wj-card-border bg-wj-card`
- `bg-violet-700` save button → `bg-wj-plum rounded-xl`
- Add `<BottomNav active="profile" />`

The full replacement (logic unchanged from current file, styling updated):

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText } from "@/lib/validate";

export default function SettingsProfilePage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("username, bio").eq("id", userData.user.id).single();
      if (profile) { setUsername(profile.username); setCurrentUsername(profile.username); setBio(profile.bio ?? ""); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) { setMessage("Username must be at least 3 characters."); return; }
    setSaving(true); setMessage(""); setSuccess(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("profiles").update({ username: cleaned, bio: sanitizeText(bio, 160) || null }).eq("id", userData.user.id);
    setSaving(false);
    if (error) { setMessage(error.message.includes("unique") ? "This username is already taken." : error.message); return; }
    setCurrentUsername(cleaned); setSuccess(true);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account? All your jars, wishes, and posts will be permanently removed. This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    setDeleting(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return (
    <div className="min-h-screen bg-wj-cream">
      <SiteHeader />
      <div className="flex items-center justify-center pt-20 text-sm text-wj-muted">Loading…</div>
    </div>
  );

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";
  const labelCls = "mb-1 block text-xs font-semibold text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="md:hidden mb-4">
          <a href={currentUsername ? `/u/${currentUsername}` : "/dashboard"} className="text-xs text-wj-muted">← Profile</a>
          <h1 className="text-xl font-bold text-wj-text mt-1">Settings</h1>
        </div>
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="hidden md:block border-b border-wj-card-border pb-3">
            <h1 className="text-base font-bold text-wj-text">Profile Settings</h1>
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} className={inputCls} />
            <p className="mt-1 text-xs text-wj-muted">Lowercase letters, numbers, underscores only.</p>
          </div>
          <div>
            <label className={labelCls}>Bio <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={160}
              placeholder="Tell people about yourself…" className={inputCls} />
          </div>
          {message && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}
          {success && <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">Profile updated.</p>}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            <a href={currentUsername ? `/u/${currentUsername}` : "/dashboard"} className="text-sm text-wj-muted hover:text-wj-text">Cancel</a>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-wj-card border border-red-200 p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-xs text-wj-muted mb-3">Deleting your account removes all your data permanently.</p>
          <button onClick={handleDeleteAccount} disabled={deleting}
            className="rounded-xl border border-red-300 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
      <BottomNav active="profile" />
    </div>
  );
}
```

- [ ] **Step 3: Replace login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setMessage("Please enter your email and password."); return; }
    setLoading(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMessage("Incorrect email or password."); return; }
    window.location.href = "/dashboard";
  };

  const inputCls = "w-full rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-sm outline-none focus:border-wj-plum text-wj-text";

  return (
    <div className="min-h-screen bg-wj-cream">
      <header className="bg-wj-plum border-b border-wj-plum-mid">
        <div className="mx-auto flex h-11 max-w-5xl items-center px-4">
          <a href="/" className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#EDD98A"/>
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#6B2D40"/>
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="#EDD98A"/>
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </a>
        </div>
      </header>

      <div className="mx-auto mt-16 max-w-sm px-4">
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-6" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h1 className="text-lg font-bold text-wj-text mb-5">Sign in to WishJar</h1>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Email address</label>
              <input type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-wj-text">Password</label>
              <input type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••" className={inputCls} />
            </div>
            {message && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full rounded-xl bg-wj-plum py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-wj-card-border text-xs text-wj-muted text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="font-semibold text-wj-plum hover:underline">Create one free</a>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-wj-muted">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>{" · "}
          <a href="/terms" className="hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace signup/page.tsx**

Read current file, keep all logic (email/password/agreed state + handleSignUp), apply same styling as login: plum header, rounded-2xl card, rounded-xl inputs with wj tokens, plum submit button. No BottomNav.

- [ ] **Step 5: Replace setup/username/page.tsx**

Read current file, keep logic, apply same form styling: cream bg, plum header, centered card with rounded-2xl, input with wj tokens, plum button.

- [ ] **Step 6: Replace page.tsx (landing)**

```tsx
import JarIllustration from "@/components/JarIllustration";

export default function Home() {
  const categories = ["New Home","Wedding","Baby","Birthday","Travel","Education","Gaming","Startup","Charity","Other"];

  return (
    <div className="min-h-screen bg-wj-cream text-wj-text">
      <header className="bg-wj-plum border-b border-wj-plum-mid">
        <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#EDD98A"/>
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#6B2D40"/>
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="#EDD98A"/>
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <a href="/login" className="px-3 py-1.5 text-white/80 hover:text-white">Sign in</a>
            <a href="/signup" className="rounded-xl bg-wj-gold px-4 py-1.5 text-sm font-bold text-white hover:opacity-90">
              Join free
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-wj-card-border bg-wj-card">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-snug text-wj-text">
                Your wishes, collected.<br />Your community, connected.
              </h1>
              <p className="mb-6 text-sm leading-7 text-wj-muted">
                WishJar lets you build a wishlist for any life goal — a new home, a wedding, a baby, education, travel. Share it with people who care, and let them support you when the time is right.
              </p>
              <div className="flex items-center gap-3">
                <a href="/signup" className="rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
                  Create your first jar
                </a>
                <a href="/login" className="rounded-xl border border-wj-card-border bg-wj-card px-5 py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream">
                  Sign in
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <JarIllustration variant="partial" size={200} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-5 text-base font-semibold text-wj-text">Popular jar categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.map((cat) => (
            <div key={cat}
              className="rounded-2xl border border-wj-card-border bg-wj-card px-3 py-3 text-center text-sm text-wj-text hover:border-wj-plum cursor-default"
              style={{ boxShadow: "var(--wj-shadow)" }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-wj-card-border bg-wj-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-wj-muted">
          <span>© 2026 WishJar</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-wj-text">Privacy Policy</a>
            <a href="/terms" className="hover:text-wj-text">Terms of Service</a>
            <a href="mailto:slckkvrk@gmail.com" className="hover:text-wj-text">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 7: Update privacy/page.tsx and terms/page.tsx**

For both files, read the current content and apply these changes only:
- Outer div: `bg-[#f0eeea]` → `bg-wj-cream`
- Header: replace inline header if present, or wrap in plum header matching login page header markup
- Heading tags: add `text-wj-plum font-bold`
- Body text: `text-gray-600` → `text-wj-muted`
- Footer links: `text-gray-400` → `text-wj-muted`
- No BottomNav (public pages)

- [ ] **Step 8: Commit all**

```bash
git add src/app/u/[username]/page.tsx src/app/settings/profile/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/setup/username/page.tsx src/app/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx
git commit -m "feat: redesign profile, settings, auth, landing, and legal pages"
```

---

## Final Verification Checklist

After all tasks complete, verify each route in browser at mobile viewport (375px) and desktop (1280px):

- [ ] `/` — cream bg, plum header, JarIllustration in hero, no bottom nav
- [ ] `/login`, `/signup` — cream bg, plum header, centered card, no bottom nav
- [ ] `/setup/username` — same as auth pages
- [ ] `/dashboard` — mobile: greeting header + action buttons + tab pills + JarCards + bottom nav; desktop: plum top nav + timeline
- [ ] `/jars` — jar list, bottom nav active on "Jars"
- [ ] `/jars/new` — form with cream inputs, plum submit, bottom nav
- [ ] `/jars/[id]` — mobile hero with JarIllustration, wish cards, bottom nav
- [ ] `/jars/[id]/edit` — same form pattern as new jar
- [ ] `/jars/[id]/wishes/new` — wish form, bottom nav
- [ ] `/jars/[id]/wishes/[wishId]/edit` — wish edit form, bottom nav
- [ ] `/feed` — JarCards for community jars, bottom nav
- [ ] `/u/[username]` — large avatar, tab pills, posts/jars, bottom nav
- [ ] `/settings/profile` — form card, bottom nav
- [ ] `/privacy`, `/terms` — cream bg, plum heading, no bottom nav
