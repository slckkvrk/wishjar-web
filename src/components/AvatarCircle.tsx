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
