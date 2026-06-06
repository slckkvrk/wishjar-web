export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
  <div className="relative flex h-11 w-11 items-center justify-center">
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11 drop-shadow-sm"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="jarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B6CFF" />
          <stop offset="100%" stopColor="#4F32C8" />
        </linearGradient>
      </defs>

      <rect
        x="18"
        y="6"
        width="28"
        height="8"
        rx="3"
        fill="#9B6CFF"
      />

      <rect
        x="12"
        y="16"
        width="40"
        height="42"
        rx="10"
        fill="url(#jarGradient)"
      />

      <path
        d="M32 24.5L35.2 31L42.3 32L37.1 37L38.4 44L32 40.6L25.6 44L26.9 37L21.7 32L28.8 31L32 24.5Z"
        fill="white"
      />
    </svg>
  </div>

  <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
    WishJar
  </span>
</div>
          <nav className="flex gap-3 text-sm">
            <a href="/login" className="rounded border px-4 py-2">
              Login
            </a>
            <a href="/signup" className="rounded bg-black px-4 py-2 text-white">
              Sign Up
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
              Social wishlists for real life
            </p>

            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Collect Wishes.
              <br />
              Make Them Real.
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-gray-600">
              Create wishlists, receive support, help others, and earn WJ Points
              as dreams become real.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                className="rounded bg-violet-700 px-6 py-3 text-center font-semibold text-white"
              >
                Create Your First Jar
              </a>

              <a
                href="/login"
                className="rounded border px-6 py-3 text-center font-semibold"
              >
                Login
              </a>
            </div>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-6">
            <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">New Home Jar</h2>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">
                  Active
                </span>
              </div>

              <p className="mb-4 text-gray-600">
                Sofa, kitchen essentials, small appliances, and moving support.
              </p>

              <div className="mb-2 h-3 rounded-full bg-gray-200">
                <div className="h-3 w-2/5 rounded-full bg-violet-600" />
              </div>

              <p className="text-sm text-gray-500">$420 supported of $1,000</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border bg-white p-4">
                <p className="font-semibold">Wedding</p>
                <p className="text-gray-500">Registry jars</p>
              </div>

              <div className="rounded border bg-white p-4">
                <p className="font-semibold">Baby</p>
                <p className="text-gray-500">Family support</p>
              </div>

              <div className="rounded border bg-white p-4">
                <p className="font-semibold">Travel</p>
                <p className="text-gray-500">Dream trips</p>
              </div>

              <div className="rounded border bg-white p-4">
                <p className="font-semibold">Education</p>
                <p className="text-gray-500">Learning goals</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t pt-4 text-sm text-gray-500">
          WishJar · Built by slckkvrk
        </footer>
      </section>
    </main>
  );
}