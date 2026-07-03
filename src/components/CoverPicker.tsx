import { COVER_TEMPLATES } from "@/lib/coverTemplates";

type Props = { value: string | null; onChange: (id: string) => void };

export default function CoverPicker({ value, onChange }: Props) {
  const selected = value ?? "3";
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(COVER_TEMPLATES).map(([id, background]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-label={`Cover template ${id}`}
          className="h-14 rounded-xl border-2 transition-colors"
          style={{ background, borderColor: selected === id ? "#3D1A24" : "transparent" }}
        />
      ))}
    </div>
  );
}
