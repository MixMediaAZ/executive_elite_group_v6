# Database Schema Cleanup Guide

## Current Situation

Your database has tables in multiple schemas:

### ✅ `exec_elite` Schema (CORRECT - 14 tables)
- User, CandidateProfile, EmployerProfile, Job, Application, etc.
- These match your Prisma schema

### ⚠️ `public` Schema (LEGACY - 60+ old tables)
- Old tables from previous version: `job_postings`, `employer_profiles`, `job_seeker_profiles`, etc.
- These don't match your current Prisma schema

### ✅ `auth` Schema (KEEP - Supabase Auth)
- Supabase's built-in authentication tables
- **DO NOT DELETE**

## Solution Options

### Option 1: Clean Up `public` Schema (Recommended)

Delete the old tables in `public` schema to avoid confusion:

```sql
-- Run this in Supabase SQL Editor
-- This will drop all old tables in public schema

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

**Then update Prisma to use `exec_elite` schema:**

Update `prisma/schema.prisma` to specify the schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["exec_elite", "auth"]
}

// Add @@schema("exec_elite") to each model
model User {
  @@schema("exec_elite")
  // ... rest of model
}
```

### Option 2: Move Tables to `public` Schema

Move all tables from `exec_elite` to `public`:

```sql
-- Run in Supabase SQL Editor
-- Move all tables from exec_elite to public

ALTER TABLE exec_elite."User" SET SCHEMA public;
ALTER TABLE exec_elite."CandidateProfile" SET SCHEMA public;
ALTER TABLE exec_elite."EmployerProfile" SET SCHEMA public;
ALTER TABLE exec_elite."Tier" SET SCHEMA public;
ALTER TABLE exec_elite."Job" SET SCHEMA public;
ALTER TABLE exec_elite."JobPayment" SET SCHEMA public;
ALTER TABLE exec_elite."Application" SET SCHEMA public;
ALTER TABLE exec_elite."Resume" SET SCHEMA public;
ALTER TABLE exec_elite."SavedJob" SET SCHEMA public;
ALTER TABLE exec_elite."AuditLog" SET SCHEMA public;
ALTER TABLE exec_elite."AnalyticsEvent" SET SCHEMA public;
ALTER TABLE exec_elite."Notification" SET SCHEMA public;
ALTER TABLE exec_elite."Message" SET SCHEMA public;
ALTER TABLE exec_elite."Interview" SET SCHEMA public;

-- Then drop the exec_elite schema
DROP SCHEMA exec_elite CASCADE;
```

**Then clean up old `public` tables:**

```sql
-- Drop old legacy tables (be careful - review first!)
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.employer_profiles CASCADE;
DROP TABLE IF EXISTS public.job_seeker_profiles CASCADE;
-- ... etc for all old tables
```

### Option 3: Start Fresh (Easiest)

1. **Delete everything** (except `auth` schema):
   ```sql
   DROP SCHEMA exec_elite CASCADE;
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

2. **Recreate using Prisma**:
   ```bash
   npx prisma db push
   ```

## Recommended: Option 3 (Start Fresh)

Since you're starting fresh anyway, this is the cleanest approach:

1. ✅ Drop `exec_elite` schema
2. ✅ Drop `public` schema (old tables)
3. ✅ Recreate `public` schema
4. ✅ Run `npx prisma db push` to create tables in `public` schema
5. ✅ Prisma will work correctly with default `public` schema

## Verification

After cleanup, verify you have exactly 14 tables in `public` schema:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- User
- CandidateProfile
- EmployerProfile
- Tier
- Job
- JobPayment
- Application
- Resume
- SavedJob
- AuditLog
- AnalyticsEvent
- Notification
- Message
- Interview

