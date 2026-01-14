# The Executive Elite Group (v4)

Executive healthcare job board with premium branding and modern UI.

## Quick Setup

**📖 For fresh Supabase database, see [FRESH_DATABASE_SETUP.md](./FRESH_DATABASE_SETUP.md)**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```cmd
   copy .env.example .env
   ```
   Then edit `.env` and add your Supabase connection string (Session mode from Supabase Dashboard)

3. **Test database connection:**
   ```cmd
   npm run db:test
   ```
   This will verify your connection and guide you through any issues.

4. **Setup database (creates all tables and seeds data):**
   ```cmd
   npm run db:setup
   ```
   This creates all tables, enums, and seeds default job tiers.

5. **Start dev server:**
   ```cmd
   npm run dev
   ```
   The script will automatically find an open port starting at 3000.

## Routes

- Home:        `/`
- Register:    `/auth/register`
- Login:       `/auth/login`
- Dashboard:   `/dashboard` (after login)
- Profile:     `/dashboard/profile`
- Jobs (public): `/jobs`
- Job Detail (public): `/jobs/[id]`
- Jobs (dashboard): `/dashboard/jobs`
- Admin Console: `/dashboard/admin`
- Saved Jobs: `/dashboard/saved`
- Applications: `/dashboard/applications`

## Features

- PostgreSQL database (Supabase compatible)
- NextAuth v5 authentication (credentials provider)
- Premium executive branding with serif/sans typography
- Left-side drawer navigation (role-aware)
- Search-first homepage & public job discovery
- Candidate, Employer, and Admin dashboards
- Employer verification + job approval workflow
- Saved jobs, applications, and tiered job postings
- Notifications system
- Messaging between candidates and employers
- Interview scheduling

## Deployment

**📋 See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment guide**

**🚀 See [BETA_READY_SUMMARY.md](./BETA_READY_SUMMARY.md) for beta readiness status**

### Quick Deploy Steps:

1. Set production environment variables (see `.env.production.example`)
2. Run `npm run build` to verify build
3. Deploy to Vercel/Railway/Render/etc.
4. Run `npm run db:setup` on production database
5. Run `npm run create-admin` to create admin user

## Admin Access

Default admin credentials (change after first login!):
- Email: `admin@executiveelite.com`
- Password: `Admin123!`

Create admin: `npm run create-admin`

## Windows CMD Terminal

All commands work with Windows CMD terminal. See [CMD_COMMANDS.md](./CMD_COMMANDS.md) for reference.

**Note:** If you get Prisma file lock errors, see [FIX_PRISMA_LOCK.md](./FIX_PRISMA_LOCK.md) for solutions.
