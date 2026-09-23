"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return "Email ou mot de passe incorrect.";
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function ensureEntry(date: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  // Atomic upsert on the (user_id, date) unique constraint — avoids the
  // check-then-insert race that dropped writes when two fields were
  // saved in quick succession (e.g. tapping two toggles back to back).
  const { data: entry, error } = await supabase
    .from("entries")
    .upsert({ user_id: userId, date }, { onConflict: "user_id,date" })
    .select("id")
    .single();

  if (error || !entry) {
    throw new Error(error?.message ?? "Impossible de créer l'entrée du jour.");
  }

  return { supabase, entryId: entry.id as string };
}

export async function saveScale(date: string, dimensionId: string, value: number) {
  const { supabase, entryId } = await ensureEntry(date);
  const { error } = await supabase
    .from("entry_scores")
    .upsert(
      { entry_id: entryId, dimension_id: dimensionId, value_int: value, value_bool: null },
      { onConflict: "entry_id,dimension_id" }
    );
  return { ok: !error };
}

export async function saveBoolean(date: string, dimensionId: string, value: boolean) {
  const { supabase, entryId } = await ensureEntry(date);
  const { error } = await supabase
    .from("entry_scores")
    .upsert(
      { entry_id: entryId, dimension_id: dimensionId, value_bool: value, value_int: null },
      { onConflict: "entry_id,dimension_id" }
    );
  return { ok: !error };
}

export async function saveNote(date: string, noteText: string) {
  const { supabase, entryId } = await ensureEntry(date);
  const { error } = await supabase
    .from("entries")
    .update({ note_text: noteText })
    .eq("id", entryId);
  return { ok: !error };
}
