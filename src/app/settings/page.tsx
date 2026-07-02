"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");

  useEffect(() => {
    const load = async () => {
      const auth = await requireUsername();
      if (!auth) return;
      setSavedUsername(auth.username);
      setLoading(false);
    };
    load();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete account? All data will be removed. Cannot be undone.")) return;
    if (!confirm("Sure?")) return;
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

  return (
    <div className="min-h-screen bg-wj-cream pb-20 md:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="flex items-center gap-3 mb-5 text-sm">
          <a href="/dashboard" className="text-wj-plum hover:underline">← Home</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Settings</h1>
        </div>

        {/* Profile link */}
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 mb-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-wj-text mb-1">Profile</h2>
          <p className="text-xs text-wj-muted mb-3">Edit your public username and bio.</p>
          <a
            href="/settings/profile"
            className="inline-block rounded-xl border border-wj-card-border px-4 py-2 text-sm font-semibold text-wj-text hover:bg-wj-cream"
          >
            Edit profile →
          </a>
        </div>

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

        {/* Sign out */}
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 mb-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-wj-text mb-1">Account</h2>
          <p className="text-xs text-wj-muted mb-3">Sign out on this device.</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-xl border border-wj-card-border py-2.5 text-sm font-bold text-wj-text hover:bg-wj-cream disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* Legal */}
        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 mb-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-wj-text mb-3">Legal</h2>
          <div className="space-y-2 text-sm">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="block text-wj-plum hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="block text-wj-plum hover:underline">
              Terms of Service
            </a>
            <p className="mt-2 text-xs text-wj-muted">
              Questions? Email{" "}
              <a href="mailto:slckkvrk@gmail.com" className="underline">slckkvrk@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl bg-wj-card border border-red-200 p-5" style={{ boxShadow: "var(--wj-shadow)" }}>
          <h2 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="mb-3 text-xs leading-5 text-wj-muted">Removes all data. Cannot be undone.</p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
