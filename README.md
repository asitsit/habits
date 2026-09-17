# Tête / Cœur / Corps

Application personnelle de suivi quotidien du bien-être (Next.js + Supabase).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- Déploiement Vercel

## Démarrage local

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé anon du projet Supabase
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Base de données Supabase

Le schéma vit dans [supabase/migrations](supabase/migrations). Pour l'appliquer :

- Via le SQL Editor du dashboard Supabase : coller le contenu des fichiers de
  `supabase/migrations`, dans l'ordre, et exécuter.
- Ou via la CLI Supabase, une fois le projet lié (`supabase link`) :
  ```bash
  npx supabase db push
  ```

Le fichier `0002_seed_themes_dimensions.sql` insère les thèmes et dimensions de
départ pour le premier utilisateur présent dans `auth.users` — le compte doit
donc déjà exister dans Supabase Auth avant de lancer le seed.

## Déploiement Vercel

1. Importer le repo GitHub sur [vercel.com/new](https://vercel.com/new).
2. Renseigner les variables d'environnement (Project Settings → Environment
   Variables), identiques à `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Chaque push sur `main` redéploie automatiquement.
