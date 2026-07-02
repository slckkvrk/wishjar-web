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
