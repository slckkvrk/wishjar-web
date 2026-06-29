type Props = { value: number; label?: string };

export default function ProgressBar({ value, label }: Props) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-wj-card-border">
        <div
          className="h-2 rounded-full bg-wj-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <span className="text-xs font-semibold shrink-0 text-wj-text">{label}</span>
      )}
    </div>
  );
}
