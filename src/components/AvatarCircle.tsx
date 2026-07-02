type Props = { name: string; size?: "sm" | "md" | "lg"; avatarUrl?: string | null };

const sizes = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

export default function AvatarCircle({ name, size = "md", avatarUrl }: Props) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 bg-wj-plum`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-wj-plum`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
