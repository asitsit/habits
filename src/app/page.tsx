import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-50">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Tête / Cœur / Corps</h1>
        <p className="text-sm text-zinc-400">
          {error
            ? `Connexion Supabase en erreur : ${error.message}`
            : "Connexion Supabase OK"}
        </p>
      </div>
    </div>
  );
}
