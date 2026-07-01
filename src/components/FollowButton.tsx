import { useState } from "react";
import { supabase } from "@/lib/supabase";

type FollowButtonProps = {
  jarId: string;
  userId: string;
  following: boolean;
  onToggle: (nowFollowing: boolean) => void;
};

export default function FollowButton({ jarId, userId, following, onToggle }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const nextFollowing = !following;
    onToggle(nextFollowing);

    const { error } = nextFollowing
      ? await supabase.from("jar_follows").insert({ user_id: userId, jar_id: jarId })
      : await supabase.from("jar_follows").delete().eq("user_id", userId).eq("jar_id", jarId);

    setLoading(false);
    if (error) onToggle(following);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex-1 py-2 text-sm font-semibold text-center rounded-xl border disabled:opacity-60 ${
        following
          ? "text-wj-plum bg-wj-card border-wj-plum"
          : "text-white bg-wj-plum border-wj-plum"
      }`}
    >
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}
