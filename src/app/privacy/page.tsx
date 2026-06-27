export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-800">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-8 inline-block text-sm text-violet-600 hover:underline">
          ← Back to WishJar
        </a>

        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-2 text-sm text-gray-400">
          Last updated: June 27, 2026
        </p>
        <p className="mb-10 text-sm text-gray-500">
          This policy also serves as the{" "}
          <strong>KVKK Aydınlatma Metni</strong> (Disclosure Notice) required
          under Turkish Law No. 6698 on the Protection of Personal Data, and as
          a GDPR-compliant privacy notice for users in the European Economic
          Area.
        </p>

        <section className="space-y-10 text-sm leading-7 text-gray-700">

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">1. Data Controller</h2>
            <p>
              <strong>WishJar</strong> is operated by Selçuk Kıvrak
              ("we", "us", "our"). For KVKK purposes, Selçuk Kıvrak is the
              data controller (<em>veri sorumlusu</em>).
            </p>
            <p className="mt-2">
              Contact:{" "}
              <a href="mailto:slckkvrk@gmail.com" className="text-violet-600 underline">
                slckkvrk@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">2. What Data We Collect</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Account data:</strong> Email address and password hash
                (managed by Supabase Auth).
              </li>
              <li>
                <strong>Profile data:</strong> Username and optional bio that
                you choose when setting up your profile.
              </li>
              <li>
                <strong>Jar and wish data:</strong> Titles, descriptions,
                categories, goal amounts, product URLs and prices you enter.
              </li>
              <li>
                <strong>Posts:</strong> Text content you share on your profile.
              </li>
              <li>
                <strong>Usage data:</strong> IP address, browser type,
                timestamps of requests — collected automatically by our
                infrastructure provider (Supabase / Vercel).
              </li>
            </ul>
            <p className="mt-3 text-gray-500">
              We do <strong>not</strong> collect payment card data, precise
              location, or biometric data.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">3. Why We Process Your Data</h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">Purpose</th>
                  <th className="border p-3 text-left">Legal basis (GDPR)</th>
                  <th className="border p-3 text-left">Legal basis (KVKK)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Providing the WishJar service", "Art. 6(1)(b) — Performance of contract", "Art. 5(2)(c) — Necessity for contract"],
                  ["Account authentication", "Art. 6(1)(b) — Performance of contract", "Art. 5(2)(c) — Necessity for contract"],
                  ["Security and fraud prevention", "Art. 6(1)(f) — Legitimate interest", "Art. 5(2)(f) — Legitimate interest"],
                  ["Improving the service", "Art. 6(1)(f) — Legitimate interest", "Art. 5(2)(f) — Legitimate interest"],
                  ["Legal obligation compliance", "Art. 6(1)(c) — Legal obligation", "Art. 5(2)(a) — Explicitly provided by law"],
                ].map(([purpose, gdpr, kvkk]) => (
                  <tr key={purpose}>
                    <td className="border p-3">{purpose}</td>
                    <td className="border p-3 text-gray-500">{gdpr}</td>
                    <td className="border p-3 text-gray-500">{kvkk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">4. Data Transfers Outside Turkey / EEA</h2>
            <p>
              Your data is stored and processed on servers operated by{" "}
              <strong>Supabase, Inc.</strong> (United States) and{" "}
              <strong>Vercel, Inc.</strong> (United States). Both providers
              offer Standard Contractual Clauses (SCCs) and GDPR Data Processing
              Agreements. For KVKK purposes, this constitutes a cross-border
              transfer; we rely on explicit user consent given at account
              creation.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">5. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is
              active. If you delete your account, all associated data
              (profile, jars, wishes, posts) is permanently deleted within
              30 days. Anonymized usage statistics may be retained longer.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">6. Your Rights</h2>
            <p className="mb-3">
              Under both GDPR and KVKK, you have the right to:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>Access</strong> the personal data we hold about you</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data</li>
              <li><strong>Erase</strong> your data ("right to be forgotten")</li>
              <li><strong>Restrict</strong> processing in certain circumstances</li>
              <li><strong>Data portability</strong> — receive your data in a structured format</li>
              <li><strong>Object</strong> to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> at any time (where processing is consent-based)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:slckkvrk@gmail.com" className="text-violet-600 underline">
                slckkvrk@gmail.com
              </a>
              . We will respond within 30 days (KVKK) / 30 days (GDPR).
            </p>
            <p className="mt-3 text-gray-500">
              KVKK users may also apply directly to the Personal Data Protection
              Authority (KVKK — Kişisel Verileri Koruma Kurumu) at{" "}
              <a
                href="https://www.kvkk.gov.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 underline"
              >
                kvkk.gov.tr
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">7. Security</h2>
            <p>
              We use industry-standard security measures: all data is
              transmitted over HTTPS, passwords are hashed and never stored in
              plain text, database access is protected by Row-Level Security
              (RLS) policies ensuring users can only access their own data, and
              our infrastructure providers hold SOC 2 certifications.
            </p>
            <p className="mt-2">
              In the event of a personal data breach, we will notify affected
              users and relevant supervisory authorities within 72 hours as
              required by GDPR.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">8. Cookies</h2>
            <p>
              WishJar uses only essential session cookies set by Supabase Auth
              to keep you logged in. We do not use advertising cookies, tracking
              pixels, or third-party analytics.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">9. Children</h2>
            <p>
              WishJar is not directed to children under 13 (or under 16 in the
              EEA). We do not knowingly collect data from children. If you
              believe a child has created an account, please contact us for
              immediate deletion.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">10. Changes to This Policy</h2>
            <p>
              We may update this policy as the service evolves. Material changes
              will be communicated by email or in-app notice at least 30 days
              before they take effect.
            </p>
          </div>

        </section>

        <footer className="mt-12 border-t pt-6 text-xs text-gray-400">
          WishJar ·{" "}
          <a href="/terms" className="underline">Terms of Service</a>
          {" · "}
          <a href="mailto:slckkvrk@gmail.com" className="underline">Contact</a>
        </footer>
      </div>
    </main>
  );
}
