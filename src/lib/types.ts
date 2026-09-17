export type DimensionType = "scale" | "boolean";

export type Theme = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type Dimension = {
  id: string;
  theme_id: string | null;
  name: string;
  type: DimensionType;
  group_label: string | null;
  icon: string | null;
  sort_order: number;
};

export type EntryScore = {
  dimension_id: string;
  value_int: number | null;
  value_bool: boolean | null;
};

export type Entry = {
  id: string;
  date: string;
  note_text: string | null;
  voice_transcript: string | null;
};

export type TodayData = {
  date: string;
  themes: Theme[];
  dimensions: Dimension[];
  entry: Entry | null;
  scores: EntryScore[];
};
