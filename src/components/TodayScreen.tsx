"use client";

import { useEffect, useRef, useState } from "react";
import { fetchDayStatuses } from "@/lib/queries";
import { addDays, formatDayLabel, startOfWeek, toIso, todayIso as computeTodayIso } from "@/lib/date";
import { WEEKS_BACK, WeekStrip, type WeekStripHandle } from "./WeekStrip";
import { DayEntryForm } from "./DayEntryForm";
import { SignOutButton } from "./SignOutButton";
import { BottomNav } from "./BottomNav";

export function TodayScreen() {
  const [today] = useState(computeTodayIso);
  const [selected, setSelected] = useState(today);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());
  const [currentWeekVisible, setCurrentWeekVisible] = useState(true);
  const stripRef = useRef<WeekStripHandle>(null);

  const weekStart = startOfWeek(new Date(`${today}T00:00:00`));
  const weekEnd = addDays(weekStart, 6);

  const rangeStart = toIso(addDays(weekStart, -WEEKS_BACK * 7));
  const rangeEnd = toIso(weekEnd);

  function refreshStatuses() {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }

  useEffect(() => {
    fetchDayStatuses(rangeStart, rangeEnd).then((dates) => setDoneDates(new Set(dates)));
  }, [rangeStart, rangeEnd]);

  const dateLabel = formatDayLabel(selected);
  const showTodayButton = selected !== today || !currentWeekVisible;

  function goToToday() {
    setSelected(today);
    stripRef.current?.scrollToCurrentWeek();
  }

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
          <div className="flex items-center gap-3">
            {showTodayButton && (
              <button
                type="button"
                onClick={goToToday}
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200"
              >
                Aujourd&apos;hui
              </button>
            )}
            <SignOutButton />
          </div>
        </div>
        <WeekStrip
          ref={stripRef}
          currentWeekStart={weekStart}
          todayIso={today}
          selectedIso={selected}
          doneDates={doneDates}
          onSelect={setSelected}
          onCurrentWeekVisibleChange={setCurrentWeekVisible}
        />
      </header>

      <main className="px-5 pt-5">
        <DayEntryForm key={selected} date={selected} onSaved={refreshStatuses} />
      </main>

      <BottomNav />
    </div>
  );
}
