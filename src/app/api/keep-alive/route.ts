import { createClient } from "@supabase/supabase-js";

// Appelée chaque jour par le cron Vercel (vercel.json) pour que le projet
// Supabase gratuit ne soit jamais mis en pause après 7 jours d'inactivité.
// Doublé par .github/workflows/keep-alive.yml, qui appelle Supabase directement.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Écriture réelle en base (migration 0003) : c'est ce qui compte comme activité.
  const { data, error } = await supabase.rpc("keep_alive");
  if (!error) {
    return Response.json({ ok: true, pinged_at: data });
  }

  // Migration pas encore appliquée : on lit quand même la base pour ne pas
  // perdre la journée, mais on signale l'erreur.
  await supabase.from("themes").select("id").limit(1);
  return Response.json({ ok: false, error: error.message }, { status: 500 });
}
