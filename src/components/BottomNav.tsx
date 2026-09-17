"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumn, House } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Aujourd'hui", icon: House },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: ChartColumn },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-900 bg-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
                active ? "text-zinc-50" : "text-zinc-600"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
