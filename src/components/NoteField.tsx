"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { saveNote } from "@/app/actions";

// Web Speech API : pas encore typée dans lib.dom, on décrit le minimum utilisé.
type SpeechResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: SpeechResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Chrome Android renvoie parfois des résultats finaux cumulatifs
// ("bonjour", "bonjour je vais bien") : on ne garde que la version la plus longue.
function joinFinals(finals: string[]) {
  const kept: string[] = [];
  for (const raw of finals) {
    const t = raw.trim();
    if (!t) continue;
    const last = kept[kept.length - 1];
    if (last && t.toLowerCase().startsWith(last.toLowerCase())) kept[kept.length - 1] = t;
    else kept.push(t);
  }
  return kept.join(" ");
}

function appendText(base: string, addition: string) {
  if (!addition) return base;
  if (!base.trim()) return addition;
  return /\s$/.test(base) ? base + addition : `${base} ${addition}`;
}

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
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // Détecté après le montage pour éviter un écart d'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getRecognitionCtor() !== null);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      recognitionRef.current?.stop();
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

  function startDictation() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const base = value;
    let dictated = "";

    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const finals: string[] = [];
      let pending = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals.push(r[0].transcript);
        else pending += r[0].transcript;
      }
      dictated = joinFinals(finals);
      setValue(appendText(base, dictated));
      setInterim(pending.trim());
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setInterim("");
      if (dictated) commit(appendText(base, dictated));
    };
    recognition.onerror = () => recognition.stop();

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function toggleDictation() {
    if (recognitionRef.current) recognitionRef.current.stop();
    else startDictation();
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        readOnly={listening}
        placeholder="Comment s'est passée ta journée ?"
        rows={4}
        className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 p-4 pb-14 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />

      {listening && (
        <p className="pointer-events-none absolute bottom-4 left-4 right-16 truncate text-xs text-zinc-500">
          {interim || "Je t'écoute…"}
        </p>
      )}

      {supported && (
        <button
          type="button"
          onClick={toggleDictation}
          aria-label={listening ? "Arrêter la dictée" : "Dicter une note"}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            listening ? "animate-pulse bg-red-500 text-white" : "bg-zinc-800 text-zinc-300"
          }`}
        >
          {listening ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
        </button>
      )}
    </div>
  );
}
