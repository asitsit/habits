"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-50">
      <form action={formAction} className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Tête / Cœur / Corps</h1>
          <p className="text-sm text-zinc-400">Connecte-toi pour continuer</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-zinc-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-zinc-500"
          />
        </div>

        {error && <p className="text-center text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-zinc-50 py-3 text-base font-medium text-black transition-opacity disabled:opacity-50"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
