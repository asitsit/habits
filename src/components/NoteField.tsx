"use client";

import { useEffect, useRef, useState } from "react";
import { saveNote } from "@/app/actions";

export function NoteField({
  date,
  initialValue,
}: {
  date: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveNote(date, next);
    }, 1000);
  }

  function handleBlur() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    saveNote(date, value);
  }

  return (
    <textarea
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder="Comment s'est passée ta journée ?"
      rows={4}
      className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
    />
  );
}
