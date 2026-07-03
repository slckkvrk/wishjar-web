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
