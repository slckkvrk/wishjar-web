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
