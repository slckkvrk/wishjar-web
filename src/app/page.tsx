export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-white text-black">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-sm" aria-hidden="true">
              <defs>
                <linearGradient id="jarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6CFF" />
                  <stop offset="100%" stopColor="#4F32C8" />
                </linearGradient>
              </defs>
              <rect x="18" y="6" width="28" height="8" rx="3" fill="#9B6CFF" />
              <rect x="12" y="16" width="40" height="42" rx="10" fill="url(#jarGradient)" />
              <path
                d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
                fill="white"
              />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-violet-200">WishJar</span>
          </div>

          <nav className="flex gap-3 text-sm">
            <a
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white/80 hover:bg-white/10"
            >
              Login
            </a>
            <a
              href="/signup"
              className="rounded-full bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500"
            >
              Sign Up
            </a>
          </nav>
        </header>

        {/* Hero */}
        <div className="grid flex-1 items-center gap-10 py-20 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-violet-400">
              Social wishlists for real life
            </p>

            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              Collect Wishes.
              <br />
              Make Them Real.
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-white/60">
              Create a jar for any life goal — home, wedding, travel, education.
              Add wish items, share with friends and family, and build toward what matters.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                className="rounded-full bg-violet-600 px-7 py-3 text-center font-semibold text-white hover:bg-violet-500"
              >
                Create Your First Jar
              </a>

              <a
                href="/login"
                className="rounded-full border border-white/20 px-7 py-3 text-center font-semibold text-white/80 hover:bg-white/10"
              >
                Login
              </a>
            </div>
          </div>

          {/* Preview card */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="mb-4 rounded-2xl bg-white p-5 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold">New Home Jar</h2>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Active
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Sofa, kitchen essentials, and moving support.
              </p>
              <div className="mb-2 h-2 rounded-full bg-gray-200">
                <div className="h-2 w-2/5 rounded-full bg-violet-600" />
              </div>
              <p className="text-xs text-gray-400">$420 of $1,000 goal</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Wedding", "Baby", "Travel", "Education"].map((cat) => (
                <div key={cat} className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold text-white">{cat}</p>
                  <p className="text-xs text-white/50">Wish jar</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-4 text-xs text-white/30">
          WishJar · Made by slckkvrk
        </footer>

      </section>
    </main>
  );
}
