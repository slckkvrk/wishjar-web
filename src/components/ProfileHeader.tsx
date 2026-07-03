import { Camera, SquarePlay, Share2, Music2, Mail, MapPin, BadgeCheck } from "lucide-react";
// Note: lucide-react 1.23.0 (installed here) has removed brand-specific icons
// (Instagram/Youtube/Facebook are no longer exported). Using closest generic
// equivalents: Camera (Instagram), SquarePlay (YouTube), Share2 (Facebook).
import AvatarCircle from "./AvatarCircle";
import { coverBackground } from "@/lib/coverTemplates";

export type ProfileHeaderData = {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  country: string | null;
  isVerified: boolean;
  coverTemplate: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialYoutube: string | null;
  socialFacebook: string | null;
  contactEmail: string | null;
};

type Props = { profile: ProfileHeaderData };

export default function ProfileHeader({ profile }: Props) {
  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : `@${profile.username}`;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div>
      <div className="h-24 rounded-t-2xl" style={{ background: coverBackground(profile.coverTemplate) }} />
      <div className="px-4 -mt-8">
        <div className="rounded-full border-4 border-wj-cream inline-block">
          <AvatarCircle name={profile.username} size="lg" avatarUrl={profile.avatarUrl} />
        </div>
      </div>
      <div className="px-4 pt-2">
        <h1 className="text-lg font-bold text-wj-text flex items-center gap-1.5">
          {displayName}
          {profile.isVerified && <BadgeCheck size={16} className="text-wj-plum" aria-label="Verified account" />}
        </h1>
        <p className="text-xs text-wj-muted">@{profile.username}</p>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-wj-muted">
            <MapPin size={12} /> {location}
          </p>
        )}
        {profile.bio && <p className="mt-1.5 text-xs text-wj-text">{profile.bio}</p>}
        {(profile.contactEmail || profile.socialInstagram || profile.socialTiktok || profile.socialYoutube || profile.socialFacebook) && (
          <div className="mt-2 flex items-center gap-3 text-wj-muted">
            {profile.contactEmail && (
              <a href={`mailto:${profile.contactEmail}`} aria-label="Contact" className="hover:text-wj-plum"><Mail size={16} /></a>
            )}
            {profile.socialInstagram && (
              <a href={profile.socialInstagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-wj-plum"><Camera size={16} /></a>
            )}
            {profile.socialTiktok && (
              <a href={profile.socialTiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-wj-plum"><Music2 size={16} /></a>
            )}
            {profile.socialYoutube && (
              <a href={profile.socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-wj-plum"><SquarePlay size={16} /></a>
            )}
            {profile.socialFacebook && (
              <a href={profile.socialFacebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-wj-plum"><Share2 size={16} /></a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
