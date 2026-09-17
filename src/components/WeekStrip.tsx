const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function WeekStrip({ todayIso }: { todayIso: string }) {
  const today = new Date(`${todayIso}T00:00:00`);
  const start = startOfWeek(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <div className="flex justify-between gap-1">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs text-zinc-500">{DAY_LABELS[i]}</span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                isToday
                  ? "bg-zinc-50 font-semibold text-black"
                  : "text-zinc-400"
              }`}
            >
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
