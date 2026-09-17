"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Se déconnecter"
        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
      >
        <LogOut size={18} />
      </button>
    </form>
  );
}
