"use client";

import { useEffect, useState } from "react";
import { fetchDayStatuses } from "@/lib/queries";
import { addDays, formatDayLabel, startOfWeek, toIso, todayIso as computeTodayIso } from "@/lib/date";
import { WeekStrip } from "./WeekStrip";
import { DayEntryForm } from "./DayEntryForm";
import { SignOutButton } from "./SignOutButton";
import { BottomNav } from "./BottomNav";

export function TodayScreen() {
  const [today] = useState(computeTodayIso);
  const [selected, setSelected] = useState(today);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());

  const weekStart = startOfWeek(new Date(`${today}T00:00:00`));
  const weekEnd = addDays(weekStart, 6);

  const rangeStart = toIso(weekStart);
  const rangeEnd = toIso(weekEnd);

  function refreshStatuses() {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }

  useEffect(() => {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }, [rangeStart, rangeEnd]);

  const dateLabel = formatDayLabel(selected);

  return (
    <div className="min-h-screen bg-black pb-24 text-zinc-50">
      <header className="sticky top-0 z-10 space-y-4 border-b border-zinc-900 bg-black/95 px-5 pb-4 pt-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 capitalize">{dateLabel}</p>
            <h1 className="text-lg font-semibold">
              {selected === today ? "Aujourd'hui" : "Modifier ce jour"}
            </h1>
          </div>
          <SignOutButton />
        </div>
        <WeekStrip
          weekStart={weekStart}
          todayIso={today}
          selectedIso={selected}
          doneDates={doneDates}
          onSelect={setSelected}
        />
      </header>

      <main className="px-5 pt-5">
        <DayEntryForm key={selected} date={selected} onSaved={refreshStatuses} />
      </main>

      <BottomNav />
    </div>
  );
}
