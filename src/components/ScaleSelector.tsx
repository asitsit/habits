"use client";

import { useState, useTransition } from "react";
import { saveScale } from "@/app/actions";

export function ScaleSelector({
  date,
  dimensionId,
  color,
  initialValue,
  onSaved,
}: {
  date: string;
  dimensionId: string;
  color: string;
  initialValue: number | null;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  function handleSelect(n: number) {
    const previous = value;
    setValue(n);
    startTransition(async () => {
      try {
        const res = await saveScale(date, dimensionId, n);
        if (!res.ok) throw new Error("save failed");
        onSaved?.();
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => handleSelect(n)}
            aria-pressed={active}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors"
            style={
              active
                ? { backgroundColor: color, color: "#000" }
                : { backgroundColor: "rgba(255,255,255,0.06)", color: "#a1a1aa" }
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
