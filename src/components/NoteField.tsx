"use client";

import { useEffect, useRef, useState } from "react";
import { saveNote } from "@/app/actions";

export function NoteField({
  date,
  initialValue,
  onSaved,
}: {
  date: string;
  initialValue: string;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function commit(text: string) {
    saveNote(date, text).then((res) => {
      if (res.ok) onSaved?.();
    });
  }

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => commit(next), 1000);
  }

  function handleBlur() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    commit(value);
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
