"use client";

import { useEffect, useState } from "react";
import { Brain, Heart, Dumbbell, Sparkles, type LucideIcon } from "lucide-react";
import { fetchDayData } from "@/lib/queries";
import type { Dimension, TodayData } from "@/lib/types";
import { ScaleSelector } from "./ScaleSelector";
import { BooleanToggle } from "./BooleanToggle";
import { NoteField } from "./NoteField";

const THEME_ICONS: Record<string, LucideIcon> = {
  Tête: Brain,
  Cœur: Heart,
  Corps: Dumbbell,
};

const NEVER_BEFORE_COLOR = "#F59E0B";

type Row =
  | { kind: "single"; dim: Dimension }
  | { kind: "group"; label: string; dims: Dimension[] };

function groupDimensions(dims: Dimension[]): Row[] {
  const rows: Row[] = [];
  for (const dim of dims) {
    if (dim.group_label) {
      const last = rows[rows.length - 1];
      if (last?.kind === "group" && last.label === dim.group_label) {
        last.dims.push(dim);
        continue;
      }
      rows.push({ kind: "group", label: dim.group_label, dims: [dim] });
    } else {
      rows.push({ kind: "single", dim });
    }
  }
  return rows;
}

export function DayEntryForm({
  date,
  onSaved,
}: {
  date: string;
  onSaved?: () => void;
}) {
  const [data, setData] = useState<TodayData | null>(null);

  useEffect(() => {
    fetchDayData(date).then(setData);
  }, [date]);

  if (!data) {
    return (
      <div className="flex justify-center py-12 text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  const scoreByDimension = new Map(data.scores.map((s) => [s.dimension_id, s]));
  const themedDims = data.dimensions.filter((d) => d.theme_id);
  const orphanDims = data.dimensions.filter((d) => !d.theme_id);

  return (
    <div className="space-y-4">
      {data.themes.map((theme) => {
        const dims = themedDims.filter((d) => d.theme_id === theme.id);
        if (dims.length === 0) return null;
        const Icon = THEME_ICONS[theme.name] ?? Sparkles;
        const rows = groupDimensions(dims);

        return (
          <section
            key={theme.id}
            className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon size={18} style={{ color: theme.color }} />
              <h2 className="text-base font-semibold">{theme.name}</h2>
            </div>

            <div className="space-y-3">
              {rows.map((row) =>
                row.kind === "single" ? (
                  <div
                    key={row.dim.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-zinc-300">{row.dim.name}</span>
                    {row.dim.type === "scale" ? (
                      <ScaleSelector
                        date={date}
                        dimensionId={row.dim.id}
                        color={theme.color}
                        initialValue={scoreByDimension.get(row.dim.id)?.value_int ?? null}
                        onSaved={onSaved}
                      />
                    ) : (
                      <BooleanToggle
                        date={date}
                        dimensionId={row.dim.id}
                        color={theme.color}
                        initialValue={scoreByDimension.get(row.dim.id)?.value_bool ?? null}
                        onSaved={onSaved}
                      />
                    )}
                  </div>
                ) : (
                  <div key={row.label}>
                    <p className="mb-2 text-sm text-zinc-300">{row.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {row.dims.map((dim) => (
                        <div
                          key={dim.id}
                          className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-3"
                        >
                          <span className="text-center text-xs text-zinc-400">
                            {dim.name.replace(`${row.label} - `, "")}
                          </span>
                          <BooleanToggle
                            date={date}
                            dimensionId={dim.id}
                            color={theme.color}
                            initialValue={scoreByDimension.get(dim.id)?.value_bool ?? null}
                            onSaved={onSaved}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        );
      })}

      {orphanDims.map((dim) => (
        <section
          key={dim.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: NEVER_BEFORE_COLOR }} />
            <span className="text-sm text-zinc-300">{dim.name}</span>
          </div>
          <BooleanToggle
            date={date}
            dimensionId={dim.id}
            color={NEVER_BEFORE_COLOR}
            initialValue={scoreByDimension.get(dim.id)?.value_bool ?? null}
            onSaved={onSaved}
          />
        </section>
      ))}

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-medium text-zinc-400">Note du jour</h2>
        <NoteField date={date} initialValue={data.entry?.note_text ?? ""} onSaved={onSaved} />
      </section>
    </div>
  );
}
