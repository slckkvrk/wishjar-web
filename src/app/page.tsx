export default function Home() {
  return (
    <div className="min-h-screen bg-[#f0eeea] text-gray-800">

      {/* Top bar */}
      <header className="border-b border-[#1e0d5c] bg-[#2c1875]">
        <div className="mx-auto flex h-10 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <rect x="18" y="6" width="28" height="8" rx="2" fill="#a78bfa" />
              <rect x="12" y="16" width="40" height="42" rx="6" fill="#7c3aed" />
              <path d="M32 24L34.5 29.5L41 30.5L36.5 35L37.8 42L32 38.5L26.2 42L27.5 35L23 30.5L29.5 29.5Z" fill="white" />
            </svg>
            <span className="text-sm font-bold text-white">WishJar</span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <a href="/login" className="px-3 py-1.5 text-white/80 hover:text-white">Sign in</a>
            <a href="/signup" className="rounded bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-400">
              Join free
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-snug text-gray-900">
                Your wishes, collected.<br />Your community, connected.
              </h1>
              <p className="mb-6 text-sm leading-6 text-gray-600">
                WishJar lets you build a wishlist for any life goal — a new home,
                a wedding, a baby, education, travel. Share it with people who care,
                and let them support you when the time is right.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="/signup"
                  className="rounded bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  Create your first jar
                </a>
                <a
                  href="/login"
                  className="rounded border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Sign in
                </a>
              </div>
            </div>

            {/* Preview card */}
            <div className="rounded border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">New Home Jar</span>
                  <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">New Home</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { name: "Sofa", price: "$420" },
                  { name: "Coffee machine", price: "$180" },
                  { name: "Kitchen set", price: "$650" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-semibold text-gray-900">{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 px-4 py-3">
                <div className="mb-1.5 h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-2/5 rounded-full bg-violet-600" />
                </div>
                <p className="text-xs text-gray-500">$1,250 planned of $3,000 goal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-5 text-base font-semibold text-gray-700">Popular jar categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {["New Home", "Wedding", "Baby", "Travel", "Education", "Birthday", "Gaming", "Startup", "Charity", "Other"].map((cat) => (
            <div
              key={cat}
              className="rounded border border-gray-200 bg-white px-3 py-2.5 text-center text-sm text-gray-700 shadow-sm"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-gray-400">
          <span>© 2026 WishJar</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-gray-600">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-600">Terms of Service</a>
            <a href="mailto:slckkvrk@gmail.com" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
