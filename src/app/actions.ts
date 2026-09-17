"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TodayData } from "@/lib/types";

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

export async function getTodayData(date: string): Promise<TodayData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: themes }, { data: dimensions }, { data: entry }] = await Promise.all([
    supabase.from("themes").select("id, name, color, sort_order").order("sort_order"),
    supabase
      .from("dimensions")
      .select("id, theme_id, name, type, group_label, icon, sort_order")
      .order("sort_order"),
    supabase
      .from("entries")
      .select("id, date, note_text, voice_transcript")
      .eq("date", date)
      .maybeSingle(),
  ]);

  let scores: TodayData["scores"] = [];
  if (entry) {
    const { data } = await supabase
      .from("entry_scores")
      .select("dimension_id, value_int, value_bool")
      .eq("entry_id", entry.id);
    scores = data ?? [];
  }

  return {
    date,
    themes: themes ?? [],
    dimensions: dimensions ?? [],
    entry: entry ?? null,
    scores,
  };
}

async function ensureEntry(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) return { supabase, entryId: existing.id as string };

  const { data: created, error } = await supabase
    .from("entries")
    .insert({ user_id: user.id, date })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Impossible de créer l'entrée du jour.");
  }

  return { supabase, entryId: created.id as string };
}

export async function saveScale(date: string, dimensionId: string, value: number) {
  const { supabase, entryId } = await ensureEntry(date);
  await supabase
    .from("entry_scores")
    .upsert(
      { entry_id: entryId, dimension_id: dimensionId, value_int: value, value_bool: null },
      { onConflict: "entry_id,dimension_id" }
    );
}

export async function saveBoolean(date: string, dimensionId: string, value: boolean) {
  const { supabase, entryId } = await ensureEntry(date);
  await supabase
    .from("entry_scores")
    .upsert(
      { entry_id: entryId, dimension_id: dimensionId, value_bool: value, value_int: null },
      { onConflict: "entry_id,dimension_id" }
    );
}

export async function saveNote(date: string, noteText: string) {
  const { supabase, entryId } = await ensureEntry(date);
  await supabase.from("entries").update({ note_text: noteText }).eq("id", entryId);
}
