type Props = { line1: string | null; line2: string | null };

export default function ManifestoText({ line1, line2 }: Props) {
  if (!line1 && !line2) {
    return <p className="text-sm italic underline text-wj-text/90">What you write here becomes real.</p>;
  }
  return (
    <div>
      {line1 && <p className="text-sm text-wj-text">{line1}</p>}
      {line2 && <p className="text-sm italic underline text-wj-text/90">{line2}</p>}
    </div>
  );
}
