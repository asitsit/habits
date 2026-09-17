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

export async function getDayStatuses(startDate: string, endDate: string): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("entries")
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate);

  return (data ?? []).map((e) => e.date as string);
}

export type StatsData = {
  themes: { id: string; name: string; color: string; sort_order: number }[];
  dimensions: {
    id: string;
    theme_id: string | null;
    name: string;
    type: "scale" | "boolean";
    group_label: string | null;
    sort_order: number;
  }[];
  scores: { dimension_id: string; value_int: number | null; value_bool: boolean | null }[];
  entryCount: number;
};

export async function getStatsData(startDate: string, endDate: string): Promise<StatsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: themes }, { data: dimensions }, { data: entries }] = await Promise.all([
    supabase.from("themes").select("id, name, color, sort_order").order("sort_order"),
    supabase
      .from("dimensions")
      .select("id, theme_id, name, type, group_label, sort_order")
      .order("sort_order"),
    supabase.from("entries").select("id").gte("date", startDate).lte("date", endDate),
  ]);

  const entryIds = (entries ?? []).map((e) => e.id as string);
  let scores: StatsData["scores"] = [];
  if (entryIds.length > 0) {
    const { data } = await supabase
      .from("entry_scores")
      .select("dimension_id, value_int, value_bool")
      .in("entry_id", entryIds);
    scores = data ?? [];
  }

  return {
    themes: themes ?? [],
    dimensions: dimensions ?? [],
    scores,
    entryCount: entryIds.length,
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

  // Atomic upsert on the (user_id, date) unique constraint — avoids the
  // check-then-insert race that dropped writes when two fields were
  // saved in quick succession (e.g. tapping two toggles back to back).
  const { data: entry, error } = await supabase
    .from("entries")
    .upsert({ user_id: user.id, date }, { onConflict: "user_id,date" })
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
