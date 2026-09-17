import { addDays, toIso } from "@/lib/date";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function WeekStrip({
  weekStart,
  todayIso,
  selectedIso,
  doneDates,
  onSelect,
}: {
  weekStart: Date;
  todayIso: string;
  selectedIso: string;
  doneDates: Set<string>;
  onSelect: (iso: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex justify-between gap-1">
      {days.map((d, i) => {
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
  );
}
