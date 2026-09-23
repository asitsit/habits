"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, CircleDot, Heart, Dumbbell, Sparkles, type LucideIcon } from "lucide-react";
import { fetchStatsData, type StatsData } from "@/lib/queries";
import { toIso, todayIso as computeTodayIso } from "@/lib/date";
import { BottomNav } from "./BottomNav";

const THEME_ICONS: Record<string, LucideIcon> = {
  Tête: Brain,
  Cœur: Heart,
  Corps: Dumbbell,
};

const NEVER_BEFORE_COLOR = "#F59E0B";

type Period = "week" | "month" | "year" | "custom";
type ChartStyle = "rings" | "bars";

const CHART_STYLE_KEY = "stats-chart-style";

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

function shortName(name: string) {
  const i = name.lastIndexOf(" - ");
  return i === -1 ? name : name.slice(i + 3);
}

function statDisplay(stat: DimStat | null) {
  const pct = stat ? (stat.kind === "avg" ? (stat.avg / 5) * 100 : stat.pct) : 0;
  const text = !stat ? "—" : stat.kind === "avg" ? stat.avg.toFixed(1) : `${Math.round(stat.pct)}%`;
  return { pct, text };
}

// Une ligne pour les dimensions simples, puis une ligne par groupe (ex. Sport).
function splitRows<T extends { group_label: string | null }>(dims: T[]) {
  const singles = dims.filter((d) => !d.group_label);
  const groups = new Map<string, T[]>();
  for (const d of dims) {
    if (d.group_label) groups.set(d.group_label, [...(groups.get(d.group_label) ?? []), d]);
  }
  return [singles, ...groups.values()].filter((row) => row.length > 0);
}

// Anneau de progression avec la valeur au centre. Taille fluide, plafonnée
// pour rester lisible quand une ligne contient peu d'anneaux.
function StatRing({ label, stat, color }: StatProps) {
  const { pct, text } = statDisplay(stat);

  return (
    <div className="flex min-w-0 max-w-[5.5rem] flex-1 flex-col items-center gap-1.5">
      <div className="relative aspect-square w-full">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          {pct > 0 && (
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${pct} 100`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-zinc-100">
          {text}
        </span>
      </div>
      <span className="w-full truncate text-center text-xs text-zinc-400">{label}</span>
    </div>
  );
}

// Jauge verticale : la barre monte proportionnellement à la valeur.
function StatBar({ label, stat, color }: StatProps) {
  const { pct, text } = statDisplay(stat);

  return (
    <div className="flex min-w-0 max-w-[5.5rem] flex-1 flex-col items-center gap-1.5">
      <span className="text-sm font-semibold tabular-nums text-zinc-100">{text}</span>
      <div className="flex h-28 w-8 items-end overflow-hidden rounded-lg bg-white/5">
        <div
          className="w-full rounded-lg transition-[height]"
          style={{ height: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-full truncate text-center text-xs text-zinc-400">{label}</span>
    </div>
  );
}

type StatProps = { label: string; stat: DimStat | null; color: string };

export function StatsScreen() {
  const [today] = useState(computeTodayIso);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [data, setData] = useState<StatsData | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("rings");

  // Préférence mémorisée sur l'appareil, lue après le montage (page prérendue).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHART_STYLE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "rings" || saved === "bars") setChartStyle(saved);
    } catch {}
  }, []);

  function changeChartStyle(next: ChartStyle) {
    setChartStyle(next);
    try {
      localStorage.setItem(CHART_STYLE_KEY, next);
    } catch {}
  }

  const Stat = chartStyle === "rings" ? StatRing : StatBar;

  const { start, end } = periodRange(period, today, customStart, customEnd);

  useEffect(() => {
    fetchStatsData(start, end).then(setData);
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
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Statistiques</h1>
          <div className="flex rounded-full bg-zinc-900 p-1">
            {(
              [
                ["rings", CircleDot, "Cercles"],
                ["bars", BarChart3, "Barres"],
              ] as [ChartStyle, LucideIcon, string][]
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => changeChartStyle(key)}
                aria-label={label}
                aria-pressed={chartStyle === key}
                className={`flex h-8 w-9 items-center justify-center rounded-full ${
                  chartStyle === key ? "bg-zinc-50 text-black" : "text-zinc-400"
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
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

                  <div className="space-y-4">
                    {splitRows(dims).map((row, i) => (
                      <div key={i} className="flex justify-center gap-3">
                        {row.map((dim) => (
                          <Stat
                            key={dim.id}
                            label={shortName(dim.name)}
                            stat={computeDimStat(data.scores, dim.id, dim.type)}
                            color={theme.color}
                          />
                        ))}
                      </div>
                    ))}
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
                <div className="flex justify-center gap-2">
                  {orphanDims.map((dim) => (
                    <Stat
                      key={dim.id}
                      label={dim.name}
                      stat={computeDimStat(data.scores, dim.id, dim.type)}
                      color={NEVER_BEFORE_COLOR}
                    />
                  ))}
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
