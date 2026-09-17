"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Heart, Dumbbell, Sparkles, type LucideIcon } from "lucide-react";
import { getStatsData, type StatsData } from "@/app/actions";
import { toIso, todayIso as computeTodayIso } from "@/lib/date";
import { BottomNav } from "./BottomNav";

const THEME_ICONS: Record<string, LucideIcon> = {
  Tête: Brain,
  Cœur: Heart,
  Corps: Dumbbell,
};

const NEVER_BEFORE_COLOR = "#F59E0B";

type Period = "week" | "month" | "year" | "custom";

function periodRange(period: Period, today: string, customStart: string, customEnd: string) {
  if (period === "custom") return { start: customStart || today, end: customEnd || today };

  const d = new Date(`${today}T00:00:00`);
  if (period === "week") {
    const day = (d.getDay() + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return { start: toIso(start), end: today };
  }
  if (period === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: toIso(start), end: today };
  }
  const start = new Date(d.getFullYear(), 0, 1);
  return { start: toIso(start), end: today };
}

type DimStat =
  | { kind: "avg"; avg: number; n: number }
  | { kind: "pct"; pct: number; n: number };

function computeDimStat(
  scores: StatsData["scores"],
  dimensionId: string,
  type: "scale" | "boolean"
): DimStat | null {
  const relevant = scores.filter((s) => s.dimension_id === dimensionId);
  if (type === "scale") {
    const values = relevant.map((s) => s.value_int).filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return { kind: "avg", avg: values.reduce((a, b) => a + b, 0) / values.length, n: values.length };
  }
  const values = relevant.map((s) => s.value_bool).filter((v): v is boolean => v !== null);
  if (values.length === 0) return null;
  const yes = values.filter(Boolean).length;
  return { kind: "pct", pct: (yes / values.length) * 100, n: values.length };
}

export function StatsScreen() {
  const [today] = useState(computeTodayIso);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [data, setData] = useState<StatsData | null>(null);

  const { start, end } = periodRange(period, today, customStart, customEnd);

  useEffect(() => {
    getStatsData(start, end).then(setData);
  }, [start, end]);

  const themedDims = useMemo(
    () => data?.dimensions.filter((d) => d.theme_id) ?? [],
    [data]
  );
  const orphanDims = useMemo(
    () => data?.dimensions.filter((d) => !d.theme_id) ?? [],
    [data]
  );

  return (
    <div className="min-h-screen bg-black pb-24 text-zinc-50">
      <header className="sticky top-0 z-10 space-y-4 border-b border-zinc-900 bg-black/95 px-5 pb-4 pt-6 backdrop-blur">
        <h1 className="text-lg font-semibold">Statistiques</h1>
        <div className="flex gap-2">
          {(
            [
              ["week", "Semaine"],
              ["month", "Mois"],
              ["year", "Année"],
              ["custom", "Personnalisé"],
            ] as [Period, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                period === key ? "bg-zinc-50 text-black" : "bg-zinc-900 text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="date"
              value={customStart}
              max={today}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-100"
            />
            <span>→</span>
            <input
              type="date"
              value={customEnd}
              max={today}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-100"
            />
          </div>
        )}
      </header>

      <main className="space-y-4 px-5 pt-5">
        {!data ? (
          <p className="py-12 text-center text-sm text-zinc-500">Chargement…</p>
        ) : data.entryCount === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            Aucune entrée sur cette période.
          </p>
        ) : (
          <>
            {data.themes.map((theme) => {
              const dims = themedDims.filter((d) => d.theme_id === theme.id);
              if (dims.length === 0) return null;
              const Icon = THEME_ICONS[theme.name] ?? Sparkles;

              const scaleAverages = dims
                .filter((d) => d.type === "scale")
                .map((d) => computeDimStat(data.scores, d.id, "scale"))
                .filter((s): s is Extract<DimStat, { kind: "avg" }> => s !== null);
              const themeAvg =
                scaleAverages.length > 0
                  ? scaleAverages.reduce((a, s) => a + s.avg, 0) / scaleAverages.length
                  : null;

              return (
                <section
                  key={theme.id}
                  className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} style={{ color: theme.color }} />
                      <h2 className="text-base font-semibold">{theme.name}</h2>
                    </div>
                    {themeAvg !== null && (
                      <span className="text-sm font-semibold" style={{ color: theme.color }}>
                        {themeAvg.toFixed(1)} / 5
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {dims.map((dim) => {
                      const stat = computeDimStat(data.scores, dim.id, dim.type);
                      const pct = stat
                        ? stat.kind === "avg"
                          ? (stat.avg / 5) * 100
                          : stat.pct
                        : 0;
                      return (
                        <div key={dim.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300">{dim.name}</span>
                            <span className="text-zinc-500">
                              {!stat
                                ? "—"
                                : stat.kind === "avg"
                                  ? `${stat.avg.toFixed(1)} / 5`
                                  : `${Math.round(stat.pct)}%`}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: theme.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {orphanDims.length > 0 && (
              <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={18} style={{ color: NEVER_BEFORE_COLOR }} />
                  <h2 className="text-base font-semibold">Sans thème</h2>
                </div>
                <div className="space-y-3">
                  {orphanDims.map((dim) => {
                    const stat = computeDimStat(data.scores, dim.id, dim.type);
                    const pct = stat?.kind === "pct" ? stat.pct : 0;
                    return (
                      <div key={dim.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">{dim.name}</span>
                          <span className="text-zinc-500">
                            {stat?.kind === "pct" ? `${Math.round(stat.pct)}%` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: NEVER_BEFORE_COLOR }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
