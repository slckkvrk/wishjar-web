type Props = { missingFields: string[] };

export default function VerificationGate({ missingFields }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="rounded-2xl bg-wj-card border border-wj-card-border p-6 text-center" style={{ boxShadow: "var(--wj-shadow)" }}>
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-base font-bold text-wj-text mb-2">Verify your account to create a jar.</h1>
        {missingFields.length > 0 && (
          <p className="text-sm text-wj-muted mb-5">
            Missing: {missingFields.join(", ")}.
          </p>
        )}
        <a href="/settings/profile" className="inline-block rounded-xl bg-wj-plum px-5 py-2.5 text-sm font-bold text-white hover:bg-wj-plum-mid">
          Complete your profile
        </a>
      </div>
    </div>
  );
}
