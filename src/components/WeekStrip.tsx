"use client";

import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { addDays, toIso } from "@/lib/date";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

// Nombre de semaines passées accessibles en faisant défiler vers la droite.
export const WEEKS_BACK = 26;

export type WeekStripHandle = { scrollToCurrentWeek: () => void };

export function WeekStrip({
  ref,
  currentWeekStart,
  todayIso,
  selectedIso,
  doneDates,
  onSelect,
  onCurrentWeekVisibleChange,
}: {
  ref?: Ref<WeekStripHandle>;
  currentWeekStart: Date;
  todayIso: string;
  selectedIso: string;
  doneDates: Set<string>;
  onSelect: (iso: string) => void;
  onCurrentWeekVisibleChange?: (visible: boolean) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const weeks = Array.from({ length: WEEKS_BACK + 1 }, (_, i) =>
    addDays(currentWeekStart, (i - WEEKS_BACK) * 7)
  );

  useImperativeHandle(ref, () => ({
    scrollToCurrentWeek() {
      const el = scrollerRef.current;
      el?.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    },
  }));

  // Au montage, on se place sur la semaine en cours (la dernière).
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const atEnd = el.scrollWidth - el.scrollLeft - el.clientWidth < el.clientWidth / 2;
    onCurrentWeekVisibleChange?.(atEnd);
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto"
    >
      {weeks.map((weekStart) => (
        <div
          key={toIso(weekStart)}
          className="flex w-full shrink-0 snap-start justify-between gap-1 px-5 py-1"
        >
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(weekStart, i);
            const iso = toIso(d);
            const isToday = iso === todayIso;
            const isSelected = iso === selectedIso;
            const isDone = doneDates.has(iso);
            const isPast = iso < todayIso;

            let circleClass = "text-zinc-400";
            let circleStyle: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.06)" };
            if (isDone) {
              circleStyle = { backgroundColor: "#10B981", color: "#000" };
              circleClass = "font-semibold";
            } else if (isPast) {
              circleStyle = { backgroundColor: "rgba(244,63,94,0.18)", color: "#fb7185" };
            }

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelect(iso)}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-xs text-zinc-500">{DAY_LABELS[i]}</span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${circleClass} ${
                    isSelected ? "ring-2 ring-zinc-50 ring-offset-2 ring-offset-black" : ""
                  } ${isToday && !isSelected ? "ring-1 ring-zinc-600" : ""}`}
                  style={circleStyle}
                >
                  {d.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
