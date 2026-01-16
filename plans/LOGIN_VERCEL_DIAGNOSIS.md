# Login Failing on Vercel Deployment - Diagnosis & Fix Plan

## Executive Summary

After analyzing the authentication code, I've identified **a critical configuration issue** in [`lib/auth.ts`](lib/auth.ts:38) that causes login to fail on Vercel while working locally.

## Root Cause: Missing `trustHost` Configuration

**The Problem**: NextAuth v5 beta requires explicit `trustHost: true` configuration when deployed behind a proxy (like Vercel's edge network). Without this setting, NextAuth cannot properly determine the callback URL for the authentication flow.

### Why It Works Locally
- Locally, the application runs directly without a reverse proxy
- `NEXTAUTH_URL=http://localhost:3000` is straightforward
- No host trust issues arise

### Why It Fails on Vercel
- Vercel runs your app behind their edge proxy network
- The request's `Host` header may be modified by the proxy
- Without `trustHost: true`, NextAuth rejects the callback URLs as potentially unsafe
- This silently fails authentication, returning `null` from authorize

## Secondary Issues Found

### 1. Debug Logging to localhost:7252
Multiple `fetch()` calls throughout [`lib/auth.ts`](lib/auth.ts:9-23) and [`app/auth/login/page.tsx`](app/auth/login/page.tsx:25-62) send debugging data to `http://127.0.0.1:7252`. On Vercel:
- These requests will timeout or fail
- They add latency to the authentication flow
- May contribute to the 30-second timeout on login

### 2. Potential Environment Variable Issues
In [`lib/auth.ts`](lib/auth.ts:231-237), the secret handling has a fallback:
```typescript
secret: (() => {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET environment variable is required in production')
  }
  return secret || 'dev-secret-change-in-production'
})(),
```
If `NEXTAUTH_SECRET` is not set in Vercel environment variables, authentication will fail.

### 3. No `AUTH_URL` Configuration for NextAuth v5
NextAuth v5 uses `AUTH_URL` in addition to or instead of `NEXTAUTH_URL`. The codebase only references `NEXTAUTH_URL`.

## Recommended Fixes

### Fix 1: Add `trustHost: true` to NextAuth config (CRITICAL)

In [`lib/auth.ts`](lib/auth.ts:228-237), add `trustHost: true`:

```typescript
session: {
  strategy: 'jwt',
},
trustHost: true,  // <-- ADD THIS LINE
secret: process.env.NEXTAUTH_SECRET,
```

### Fix 2: Remove Debug Logging for Production

Remove or conditionally disable the `fetch()` calls to `localhost:7252` in production:
- [`lib/auth.ts`](lib/auth.ts:9) - getDb function
- [`lib/auth.ts`](lib/auth.ts:48) - authorize callback
- [`app/auth/login/page.tsx`](app/auth/login/page.tsx:25) - handleSubmit

### Fix 3: Verify Vercel Environment Variables

Ensure these are set in Vercel dashboard → Settings → Environment Variables:
- `NEXTAUTH_SECRET` - A secure random string (32+ characters)
- `NEXTAUTH_URL` - Your production URL (e.g., `https://yourapp.vercel.app`)
- `AUTH_URL` - Same as NEXTAUTH_URL (for NextAuth v5 compatibility)
- `DATABASE_URL` - Your Supabase connection string

### Fix 4: Simplify Secret Handling

Replace the IIFE secret assignment with direct reference:

```typescript
secret: process.env.NEXTAUTH_SECRET,
```

## Implementation Priority

1. **Immediate**: Add `trustHost: true` - this is the most likely root cause
2. **High**: Remove debug fetch calls - these add latency and will fail in production
3. **Medium**: Verify environment variables in Vercel dashboard
4. **Low**: Add `AUTH_URL` environment variable for NextAuth v5 best practices

## Testing After Fix

1. Deploy to Vercel with fixes
2. Check Vercel Function Logs for any errors
3. Test login with valid credentials
4. Verify session persists after redirect to dashboard

## Files to Modify

| File | Change |
|------|--------|
| [`lib/auth.ts`](lib/auth.ts) | Add `trustHost: true`, remove debug logging |
| [`app/auth/login/page.tsx`](app/auth/login/page.tsx) | Remove debug logging |
| [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts) | Remove debug logging |
| Vercel Dashboard | Verify/add environment variables |
