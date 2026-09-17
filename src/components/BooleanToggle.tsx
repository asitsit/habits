"use client";

import { useState, useTransition } from "react";
import { saveBoolean } from "@/app/actions";

export function BooleanToggle({
  date,
  dimensionId,
  color,
  initialValue,
  onSaved,
}: {
  date: string;
  dimensionId: string;
  color: string;
  initialValue: boolean | null;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(initialValue ?? false);
  const [, startTransition] = useTransition();

  function toggle() {
    const previous = value;
    const next = !value;
    setValue(next);
    startTransition(async () => {
      try {
        const res = await saveBoolean(date, dimensionId, next);
        if (!res.ok) throw new Error("save failed");
        onSaved?.();
      } catch {
        setValue(previous);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={value}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: value ? color : "rgba(255,255,255,0.08)" }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform"
        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}
