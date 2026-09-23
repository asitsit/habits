// Lectures faites directement depuis le navigateur vers Supabase : pas de
// détour par une fonction Vercel, et les requêtes partent en parallèle.
// La sécurité est assurée par les policies RLS (chaque user ne voit que ses lignes).

import { createClient } from "@/lib/supabase/client";
import type { Dimension, EntryScore, Theme, TodayData } from "@/lib/types";

const supabase = createClient();

export type StatsData = {
  themes: Theme[];
  dimensions: Dimension[];
  scores: EntryScore[];
  entryCount: number;
};

// Thèmes et dimensions ne changent quasiment jamais : on les charge une seule
// fois par session d'onglet, puis on réutilise la même promesse.
let structurePromise: Promise<{ themes: Theme[]; dimensions: Dimension[] }> | null = null;

function getStructure() {
  if (!structurePromise) {
    structurePromise = Promise.all([
      supabase.from("themes").select("id, name, color, sort_order").order("sort_order"),
      supabase
        .from("dimensions")
        .select("id, theme_id, name, type, group_label, icon, sort_order")
        .order("sort_order"),
    ]).then(([themes, dimensions]) => {
      if (themes.error || dimensions.error) {
        structurePromise = null;
        throw themes.error ?? dimensions.error;
      }
      return { themes: themes.data ?? [], dimensions: dimensions.data ?? [] };
    });
  }
  return structurePromise;
}

export async function fetchDayData(date: string): Promise<TodayData> {
  const [structure, { data: entry }] = await Promise.all([
    getStructure(),
    supabase
      .from("entries")
      .select("id, date, note_text, voice_transcript, entry_scores(dimension_id, value_int, value_bool)")
      .eq("date", date)
      .maybeSingle(),
  ]);

  const { entry_scores, ...entryFields } = entry ?? { entry_scores: [] };

  return {
    date,
    ...structure,
    entry: entry ? (entryFields as TodayData["entry"]) : null,
    scores: (entry_scores ?? []) as EntryScore[],
  };
}

export async function fetchDayStatuses(startDate: string, endDate: string): Promise<string[]> {
  const { data } = await supabase
    .from("entries")
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate);

  return (data ?? []).map((e) => e.date as string);
}

export async function fetchStatsData(startDate: string, endDate: string): Promise<StatsData> {
  const [structure, { data: entries }] = await Promise.all([
    getStructure(),
    supabase
      .from("entries")
      .select("entry_scores(dimension_id, value_int, value_bool)")
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  return {
    ...structure,
    scores: (entries ?? []).flatMap((e) => e.entry_scores as EntryScore[]),
    entryCount: entries?.length ?? 0,
  };
}
