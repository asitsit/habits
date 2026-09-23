"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchDayStatuses } from "@/lib/queries";
import { formatDayLabel, todayIso as computeTodayIso, toIso } from "@/lib/date";
import { DayEntryForm } from "./DayEntryForm";
import { BottomNav } from "./BottomNav";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0 = lundi
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function CalendarScreen() {
  const [today] = useState(computeTodayIso);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${computeTodayIso()}T00:00:00`);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());

  const days = monthGrid(cursor.year, cursor.month);
  const rangeStart = toIso(days[0]);
  const rangeEnd = toIso(days[days.length - 1]);

  function refreshStatuses() {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }

  useEffect(() => {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }, [rangeStart, rangeEnd]);

  function changeMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-zinc-50">
      <header className="border-b border-zinc-900 px-5 pb-4 pt-6">
        <h1 className="text-lg font-semibold">Calendrier</h1>
      </header>

      <main className="space-y-6 px-5 pt-5">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-medium capitalize">
              {MONTH_LABEL.format(new Date(cursor.year, cursor.month, 1))}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900"
              aria-label="Mois suivant"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-xs text-zinc-600">
                {w}
              </span>
            ))}
            {days.map((d) => {
              const iso = toIso(d);
              const inMonth = d.getMonth() === cursor.month;
              const isDone = doneDates.has(iso);
              const isPast = iso < today;
              const isToday = iso === today;
              const isSelected = iso === selected;

              let style: React.CSSProperties = { backgroundColor: "transparent", color: "#52525b" };
              if (inMonth) {
                if (isDone) {
                  style = { backgroundColor: "#10B981", color: "#000" };
                } else if (isPast) {
                  style = { backgroundColor: "rgba(244,63,94,0.18)", color: "#fb7185" };
                } else {
                  style = { backgroundColor: "rgba(255,255,255,0.06)", color: "#d4d4d8" };
                }
              }

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => setSelected(iso)}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                    isSelected ? "ring-2 ring-zinc-50 ring-offset-2 ring-offset-zinc-950" : ""
                  } ${isToday && !isSelected ? "ring-1 ring-zinc-500" : ""}`}
                  style={style}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-medium capitalize text-zinc-400">
              {formatDayLabel(selected)}
            </h2>
            <DayEntryForm key={selected} date={selected} onSaved={refreshStatuses} />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
