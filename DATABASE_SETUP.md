# Database Connection Setup Guide

## Supabase Connection String Format

**IMPORTANT**: If you see "Not IPv4 compatible" error, you MUST use the **Session Pooler** connection string.

### Option 1: Session Pooler (IPv4 Compatible) - **USE THIS IF YOU GET IPv4 ERROR**

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Note**: The Session Pooler uses port `5432` but with the `pooler.supabase.com` hostname. This is IPv4-compatible.

### Option 2: Direct Connection (IPv6 only - won't work if you get IPv4 error)

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.fwmlreskkorqrlybtwrt.supabase.co:5432/postgres?sslmode=require"
```

### Option 3: Transaction Pooler (Port 6543) - For Production App Usage

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

## Steps to Get Your Connection String

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Go to**: Project Settings → Database
4. **Look for "Connection string" section**
5. **Select "Session mode"** (this is IPv4-compatible)
6. **Copy the connection string** - it should have `pooler.supabase.com` in the hostname
7. **Replace `[YOUR-PASSWORD]`** with your actual database password (remove brackets)
8. **Add `?sslmode=require`** at the end if not present

## Running Migrations with Session Pooler

The Session Pooler works fine for migrations. Use this format:

```bash
# Make sure your .env has the Session Pooler connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Then run migrations
npx prisma migrate dev --name init
npm run prisma:seed
```

## Common Issues

### Issue: "Not IPv4 compatible"

- **Solution**: Use the **Session Pooler** connection string (hostname contains `pooler.supabase.com`)
- In Supabase dashboard, select "Session mode" instead of "Direct connection"
- Use port `5432` with the pooler hostname

### Issue: "Can't reach database server"

- **Check**: Is your Supabase project paused? (Go to dashboard and check project status)
- **Check**: Is your password correct? (Not your Supabase account password, but the database password)
- **Try**: Use Session Pooler connection (IPv4-compatible)

### Issue: "Cross schema references" error during migration

- **Solution**: This can happen with Session Pooler. Try using `prisma db push` instead:

  ```bash
  npx prisma db push
  npm run prisma:seed
  ```

### Issue: Password contains special characters

If your password has special characters like `@`, `#`, `%`, etc., you may need to URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- etc.

## Testing Your Connection

After updating `.env` with Session Pooler connection string, test:

```bash
npx prisma db push
```

Or run migrations:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```
