import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-4">
        WishJar
      </h1>

      <p>Supabase connection test</p>

      <pre className="mt-6">
        {JSON.stringify(
          {
            connected: !error,
            hasSession: !!data.session,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}