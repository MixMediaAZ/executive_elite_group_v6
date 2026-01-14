# Fresh Database Setup Guide

## ✅ Safe to Delete and Start Fresh

If you're starting fresh or resetting your Supabase database, follow these steps:

## Step 1: Delete Database in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Project Settings** → **Database**
4. Scroll to **"Reset database"** or **"Delete database"** section
5. Confirm deletion (⚠️ This will delete ALL data)

## Step 2: Recreate Database Schema

After deletion, you have two options:

### Option A: Using Prisma (Recommended)

1. **Update your `.env` file** with Session Pooler connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

2. **Push schema to database**:
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

4. **Seed the database** (optional):
   ```bash
   npm run prisma:seed
   ```

### Option B: Using SQL File

1. **Get your Session Pooler connection string** from Supabase Dashboard
2. **Open Supabase SQL Editor**:
   - Go to: **SQL Editor** in Supabase Dashboard
   - Click **"New query"**
3. **Run the PostgreSQL schema**:
   - Copy contents from `database_schema_postgresql.sql`
   - Paste into SQL Editor
   - Click **"Run"**

## Step 3: Verify Setup

Test your connection:

```bash
# Test database connection
npm run db:test

# Or test with Prisma
npx prisma db push
```

## Step 4: Create Admin User (Optional)

If you need an admin user:

```bash
npm run create-admin
```

## Important Notes

- ⚠️ **Backup first**: If you have important data, export it before deleting
- ✅ **Connection string**: Always use Session Pooler for IPv4 compatibility
- ✅ **Schema**: The database will be recreated with all 14 tables
- ✅ **Indexes**: All indexes will be automatically created
- ✅ **Foreign keys**: All relationships will be properly set up

## Troubleshooting

### "Not IPv4 compatible" error
- Use Session Pooler connection string (see `DATABASE_SETUP.md`)

### "Connection refused"
- Check that your Supabase project is active (not paused)
- Verify your password is correct

### "Table already exists"
- The database wasn't fully deleted, or schema was partially created
- Drop tables manually or use `prisma db push --force-reset`

## Next Steps

After database is set up:
1. ✅ Run migrations: `npx prisma migrate dev`
2. ✅ Seed data: `npm run prisma:seed`
3. ✅ Create admin: `npm run create-admin`
4. ✅ Test application: `npm run dev`
