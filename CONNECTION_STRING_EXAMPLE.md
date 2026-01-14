# Connection String Format - Exact Example

## ✅ Correct Format

Your Supabase connection string should look like this **FULL** format:

```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

## 📝 Step-by-Step

### What Supabase Gives You:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### What You Need to Do:
Just add `?sslmode=require` at the very end (after `/postgres`):

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require
                                                                                                    ^^^^^^^^^^^^^^^^^^^^
                                                                                                    ADD THIS PART
```

## 🔍 Real Example

**From Supabase:**
```
postgresql://postgres.abc123xyz:MyPassword123@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**In your `.env` file:**
```env
DATABASE_URL="postgresql://postgres.abc123xyz:MyPassword123@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## ⚠️ Common Mistakes

❌ **WRONG:** `supabase.co:5432/postgres?sslmode=require`  
✅ **RIGHT:** `postgresql://postgres.xxxxx:PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require`

❌ **WRONG:** Missing the `postgresql://` at the start  
✅ **RIGHT:** Must start with `postgresql://`

❌ **WRONG:** Missing the password part  
✅ **RIGHT:** Must include `:PASSWORD@` after `postgres.xxxxx`

## 💡 Quick Check

Your connection string should have:
1. ✅ Starts with `postgresql://`
2. ✅ Has `postgres.xxxxx` (your project ID)
3. ✅ Has `:PASSWORD@` (your database password)
4. ✅ Has `@aws-0-us-west-1.pooler.supabase.com` (or similar)
5. ✅ Has `:5432/postgres`
6. ✅ Ends with `?sslmode=require`

## 🧪 Test It

After you create your `.env` file, test it:
```bash
npm run db:test
```

If it works, you'll see:
```
✅ Database connection successful!
```

If it fails, the error message will tell you exactly what's wrong.

