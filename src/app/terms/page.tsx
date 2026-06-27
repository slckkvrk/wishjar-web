export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-800">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-8 inline-block text-sm text-violet-600 hover:underline">
          ← Back to WishJar
        </a>

        <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-10 text-sm text-gray-400">Last updated: June 27, 2026</p>

        <section className="space-y-10 text-sm leading-7 text-gray-700">

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">1. Acceptance</h2>
            <p>
              By creating a WishJar account you agree to these Terms of Service
              and our{" "}
              <a href="/privacy" className="text-violet-600 underline">
                Privacy Policy
              </a>
              . If you do not agree, do not use the service. These terms
              constitute a binding agreement between you and WishJar (operated
              by Selçuk Kıvrak).
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">2. The Service</h2>
            <p>
              WishJar lets you create wishlists ("jars"), add wish items,
              share them with others, and post updates to your profile. The
              service is currently provided free of charge, without payment
              processing or fulfillment — WishJar does not handle money or
              purchase products on your behalf.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">3. Eligibility</h2>
            <p>
              You must be at least 13 years old (or 16 in the EU/EEA) to use
              WishJar. By registering, you confirm that you meet this age
              requirement.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">4. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              credentials and for all activity that occurs under your account.
              Notify us immediately at{" "}
              <a href="mailto:slckkvrk@gmail.com" className="text-violet-600 underline">
                slckkvrk@gmail.com
              </a>{" "}
              if you suspect unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">5. Acceptable Use</h2>
            <p className="mb-3">You agree <strong>not</strong> to:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Post content that is illegal, harmful, harassing, or deceptive</li>
              <li>Impersonate another person or create fake accounts</li>
              <li>Attempt to access other users' data without authorization</li>
              <li>Use the service to distribute spam or malware</li>
              <li>Reverse-engineer, scrape, or otherwise abuse the platform</li>
              <li>Post links to products or services that violate applicable law</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">6. Your Content</h2>
            <p>
              You retain ownership of content you create (jar titles,
              descriptions, posts). By posting, you grant WishJar a
              non-exclusive, royalty-free license to display your content to
              other logged-in members for the purpose of operating the service.
              We will not sell your content to third parties.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">7. Third-Party Links</h2>
            <p>
              Wish items may contain links to third-party product pages. WishJar
              is not responsible for the content, accuracy, or safety of
              external websites. Links do not constitute endorsement.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">8. Service Availability</h2>
            <p>
              WishJar is provided "as is." We make no guarantees of uptime or
              continuous availability. We may modify, suspend, or discontinue
              any part of the service at any time, with reasonable notice where
              possible.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, WishJar and its operators
              shall not be liable for indirect, incidental, or consequential
              damages arising from your use of the service. Our total liability
              for direct damages shall not exceed the amount you paid us in the
              12 months preceding the claim (if any).
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">10. Account Termination</h2>
            <p>
              You may delete your account at any time by contacting us. We may
              suspend or terminate accounts that violate these terms, with
              immediate effect for serious violations. Upon termination, your
              data will be deleted per our Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Republic of Turkey.
              Any disputes shall be subject to the jurisdiction of Istanbul
              courts. Users in the EU/EEA may also have rights under applicable
              EU consumer protection law.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">12. Changes to Terms</h2>
            <p>
              We may update these terms. We will notify you by email or
              in-app notice at least 30 days before material changes take
              effect. Continued use after that date constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-gray-900">13. Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a href="mailto:slckkvrk@gmail.com" className="text-violet-600 underline">
                slckkvrk@gmail.com
              </a>
            </p>
          </div>

        </section>

        <footer className="mt-12 border-t pt-6 text-xs text-gray-400">
          WishJar ·{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>
          {" · "}
          <a href="mailto:slckkvrk@gmail.com" className="underline">Contact</a>
        </footer>
      </div>
    </main>
  );
}
