# 🏓 Bureau Ping Pong League

Application web de gestion de ligue de ping pong de bureau. Classements en temps réel, saisie de résultats, bracket de playoffs.

## Stack

- **Frontend** — Next.js 14 (App Router) + Tailwind CSS
- **Backend / DB** — Supabase (PostgreSQL + Realtime)
- **Déploiement** — Vercel

---

## Setup (5 min)

### 1. Installer les dépendances

```bash
cd ping-pong-league
npm install
```

### 2. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project
2. Copie l'URL et la clé **anon** (Settings → API)
3. Dans l'éditeur SQL, colle et exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql)

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec tes valeurs Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

### 4. Lancer en local

```bash
npm run dev
# → http://localhost:3000
```

### 5. Déployer sur Vercel

```bash
npx vercel --prod
```

Ajoute les deux variables d'environnement dans les settings Vercel de ton projet.

---

## Fonctionnement

### Phase de groupes
- **Groupe A** : Julie, Edouard, Ninon, Gabriel, Louis
- **Groupe B** : Nicolas, Gaëtan, Elliot, Paul, Alix
- Chaque duo joue 2 matchs (aller + retour) → 20 matchs par groupe
- Points : **victoire = 3 pts**, **défaite = 0 pt**, **bonus +1 si victoire 2-0**
- Louis joue uniquement **lundi et mardi** (rappel visuel sur ses matchs)

### Playoffs (automatique après phase de groupes)
| Phase | Format |
|-------|--------|
| Demi-finale 1 | 1er Gr. A vs 2e Gr. B · best-of-3 |
| Demi-finale 2 | 1er Gr. B vs 2e Gr. A · best-of-3 |
| Barrage | 3e Gr. A vs 3e Gr. B · best-of-3 |
| Finale | Vainqueur DF1 vs Vainqueur DF2 · best-of-5 |

### Saisie des résultats
N'importe qui peut saisir un résultat depuis :
- La page **Matchs** (vue globale avec filtres)
- Son **profil joueur** (ses matchs uniquement)

Score possible : **2-0** ou **2-1** (en sets).
