import { createClient } from "@supabase/supabase-js";

// Appelée chaque jour par le cron Vercel (vercel.json) pour que le projet
// Supabase gratuit ne soit jamais mis en pause après 7 jours d'inactivité.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Une vraie requête sur la base suffit à compter comme activité.
  const { error } = await supabase.from("themes").select("id").limit(1);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, at: new Date().toISOString() });
}
