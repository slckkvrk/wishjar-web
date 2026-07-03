"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireUsername } from "@/lib/requireUsername";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { sanitizeText, isValidUrl } from "@/lib/validate";
import CoverPicker from "@/components/CoverPicker";

export default function EditProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

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
  const [trustMessage, setTrustMessage] = useState("");
  const [trustSuccess, setTrustSuccess] = useState(false);
  const [savingTrust, setSavingTrust] = useState(false);

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

  const handleSave = async () => {
    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) { setMessage("Min 3 characters."); return; }
    if (!userId) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const bioVal = sanitizeText(bio, 160) || null;

    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update({ username: cleaned, bio: bioVal })
      .eq("id", userId)
      .select("username, bio")
      .single();

    if (updateErr) {
      if (updateErr.code === "PGRST116") {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert({ id: userId, username: cleaned, bio: bioVal }, { onConflict: "id" });
        if (upsertErr) {
          setSaving(false);
          if (upsertErr.message.includes("unique") || upsertErr.message.includes("duplicate")) {
            setMessage("Username taken. Try another.");
          } else {
            setMessage(`Error: ${upsertErr.message} [${upsertErr.code}]`);
          }
          return;
        }
      } else if (updateErr.message.includes("unique") || updateErr.message.includes("duplicate")) {
        setSaving(false);
        setMessage("Username taken. Try another.");
        return;
      } else {
        setSaving(false);
        setMessage(`Error: ${updateErr.message} [${updateErr.code}]`);
        return;
      }
    }

    setSaving(false);
    const finalUsername = updated?.username ?? cleaned;
    setSavedUsername(finalUsername);
    setUsername(finalUsername);
    setBio(updated?.bio ?? bio);
    setSuccess(true);
  };

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
          <a href={savedUsername ? `/u/${savedUsername}` : "/"} className="text-wj-plum hover:underline">
            ← Profile
          </a>
          <span className="text-wj-muted">·</span>
          <a href="/settings" className="text-wj-muted hover:text-wj-text">Settings</a>
        </div>

        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-wj-text">Edit Profile</h1>
          <p className="text-xs text-wj-muted mt-0.5">What others see on your public page.</p>
        </div>

        <div className="rounded-2xl bg-wj-card border border-wj-card-border p-5 space-y-4" style={{ boxShadow: "var(--wj-shadow)" }}>
          <div className="border-b border-wj-card-border pb-3">
            <h2 className="text-sm font-bold text-wj-text">Public profile</h2>
            <p className="text-xs text-wj-muted mt-0.5">Visible to everyone.</p>
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <div className="flex items-center rounded-xl border border-wj-card-border bg-wj-card px-3 py-2.5 focus-within:border-wj-plum">
              <span className="mr-1 text-sm text-wj-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                placeholder="your_username"
                className="flex-1 text-sm outline-none bg-transparent text-wj-text"
              />
            </div>
            <p className="mt-1 text-xs text-wj-muted">a-z, 0-9, _ · 3–20 chars</p>
          </div>
          <div>
            <label className={labelCls}>Bio <span className="text-wj-muted font-normal">(optional)</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="About you…"
              className={inputCls}
            />
            <p className="mt-1 text-right text-xs text-wj-muted">{bio.length}/160</p>
          </div>
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
          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
          )}
          {success && (
            <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              Saved! <a href={`/u/${savedUsername}`} className="underline font-semibold">View profile →</a>
            </p>
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
