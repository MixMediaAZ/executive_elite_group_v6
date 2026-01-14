# Executive Elite Group – Deployable Build (Clean)

This package removes build artifacts and branch-collision leftovers (node_modules/.next/.git, duplicate ESLint config, secret env files).

## Local run (Windows / Mac / Linux)
1) Copy `.env.example` to `.env` and fill values:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL (local: http://localhost:3000)
   - Any SUPABASE / STRIPE keys you use

2) Install + generate Prisma client
```bash
npm ci
npm run prisma:generate
```

3) Run migrations (choose one)
### Dev DB (creates migration locally)
```bash
npm run prisma:migrate
```

### Deploy DB (recommended for Render/Vercel/Neon)
```bash
npx prisma migrate deploy
```

4) Build + start
```bash
npm run build
npm start
```

## Notes
- `.env` is intentionally NOT included; use `.env.example`.
- `eslint.config.mjs` was removed to avoid ESLint v9/flat-config collisions with `.eslintrc.json`.
