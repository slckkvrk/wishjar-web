"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import JarIllustration from "@/components/JarIllustration";

export default function Home() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/dashboard";
    });
  }, []);

  return (
    <div className="min-h-screen bg-wj-cream text-wj-text">
      {/* Plum header */}
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

      {/* Hero */}
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
                <a href="/signup"
                  className="rounded-2xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
                  Create your first jar
                </a>
                <a href="/login"
                  className="rounded-2xl border border-wj-card-border px-5 py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream">
                  Sign in
                </a>
              </div>
            </div>

            {/* Preview card */}
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

      {/* How it works */}
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

      {/* Categories */}
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <h2 className="mb-5 text-base font-semibold text-wj-text">Categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {["New Home", "Wedding", "Baby", "Travel", "Education", "Birthday", "Gaming", "Startup", "Charity", "Other"].map((cat) => (
            <div key={cat}
              className="rounded-2xl border border-wj-card-border bg-wj-card px-3 py-2.5 text-center text-sm text-wj-text"
              style={{ boxShadow: "var(--wj-shadow)" }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="border-t border-wj-card-border" style={{ background: "#3D1A24" }}>
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to start?</h2>
          <p className="text-sm text-white/70 mb-6">Free. No card needed.</p>
          <a href="/signup"
            className="inline-block rounded-2xl px-8 py-3 text-sm font-bold text-wj-plum hover:opacity-80"
            style={{ background: "#EDD98A" }}>
            Get started
          </a>
        </div>
      </div>

      {/* Footer */}
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
