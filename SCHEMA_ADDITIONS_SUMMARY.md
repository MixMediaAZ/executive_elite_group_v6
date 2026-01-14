# Schema Additions Summary

## ✅ Added 4 New Tables

### 1. **JobView** - Job View Tracking
**Purpose**: Track which jobs are viewed by candidates for analytics

**Fields**:
- `id`, `jobId`, `userId` (optional), `viewedAt`, `ipAddress`, `userAgent`

**Integration**:
- ✅ Added to Prisma schema
- ✅ Created `lib/job-tracking.ts` utility
- ✅ Integrated in `app/jobs/[id]/page.tsx` (public job view)
- ✅ Integrated in `app/dashboard/jobs/[id]/page.tsx` (dashboard job view)
- ✅ Automatically tracks views when job detail pages load
- ✅ Also logs to AnalyticsEvent for consistency

**Usage**:
```typescript
import { trackJobView } from '@/lib/job-tracking'
await trackJobView(jobId, userId, headers)
```

### 2. **JobMatch** - Cached AI Matching Results
**Purpose**: Cache expensive AI matching computations for better performance

**Fields**:
- `id`, `jobId`, `candidateId`, `matchScore`, `matchReasonsJson`, `aiGenerated`, `viewed`, `applied`

**Integration**:
- ✅ Added to Prisma schema
- ✅ Updated `lib/matching.ts` to use cache
- ✅ Automatically caches matches when computed
- ✅ Returns cached matches if available (< 24 hours old)
- ✅ Marks matches as viewed when candidate views job
- ✅ Marks matches as applied when candidate applies

**Usage**:
```typescript
import { getCandidateJobMatches } from '@/lib/matching'
const matches = await getCandidateJobMatches(candidateId, forceRefresh)
```

**Benefits**:
- Faster dashboard loading (no recomputation)
- Better user experience
- Reduced database load

### 3. **SearchAnalytics** - Search Query Tracking
**Purpose**: Track search queries and results for product insights

**Fields**:
- `id`, `userId` (optional), `query`, `filtersJson`, `resultsCount`, `clickedJobId`, `searchedAt`

**Integration**:
- ✅ Added to Prisma schema
- ✅ Created `lib/search-analytics.ts` utility
- ✅ Integrated in `app/jobs/page.tsx` (tracks all searches)
- ✅ Tracks query, filters, results count, and clicked jobs

**Usage**:
```typescript
import { trackSearch } from '@/lib/search-analytics'
await trackSearch(query, filters, resultsCount, userId, clickedJobId)
```

**Analytics Available**:
- Popular search queries
- Click-through rates
- Search patterns
- Filter usage

### 4. **Subscription** - Recurring Subscription Management
**Purpose**: Handle recurring subscriptions for employers (monthly/annual plans)

**Fields**:
- `id`, `userId`, `employerId`, `tierId`, `status`, `stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`
- `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `cancelledAt`
- `amountCents`, `currency`, `interval` (month/year)

**Integration**:
- ✅ Added to Prisma schema
- ✅ Created `lib/subscriptions.ts` utility
- ✅ Created `app/api/subscriptions/route.ts` API
- ✅ Created `app/api/subscriptions/create/route.ts` API
- ✅ Updated `app/api/payments/webhook/route.ts` to handle subscription events
- ✅ Stripe webhook integration for subscription lifecycle

**Features**:
- Create subscriptions
- Cancel subscriptions (immediate or at period end)
- Check active subscription status
- Handle Stripe webhook events (payment succeeded/failed, subscription updated/deleted)

**Usage**:
```typescript
import { createSubscription, cancelSubscription, hasActiveSubscription } from '@/lib/subscriptions'

// Create subscription
const { subscriptionId, clientSecret } = await createSubscription(
  userId, employerId, tierId, stripePriceId
)

// Check if employer has active subscription
const hasActive = await hasActiveSubscription(employerId)

// Cancel subscription
await cancelSubscription(subscriptionId, cancelAtPeriodEnd)
```

## 📊 Updated Files

### Prisma Schema
- ✅ `prisma/schema.prisma` - Added 4 new models with proper relations

### SQL Files
- ✅ `database_schema.sql` - Added 4 new tables (SQLite)
- ✅ `database_schema_postgresql.sql` - Added 4 new tables (PostgreSQL)

### Utilities
- ✅ `lib/job-tracking.ts` - Job view tracking
- ✅ `lib/search-analytics.ts` - Search analytics tracking
- ✅ `lib/subscriptions.ts` - Subscription management
- ✅ `lib/matching.ts` - Updated to use JobMatch cache

### API Routes
- ✅ `app/api/subscriptions/route.ts` - GET/DELETE subscriptions
- ✅ `app/api/subscriptions/create/route.ts` - POST create subscription
- ✅ `app/api/payments/webhook/route.ts` - Updated for subscription webhooks
- ✅ `app/api/applications/route.ts` - Updated to mark JobMatch as applied

### Pages
- ✅ `app/jobs/[id]/page.tsx` - Tracks job views
- ✅ `app/dashboard/jobs/[id]/page.tsx` - Tracks job views, marks matches as viewed
- ✅ `app/jobs/page.tsx` - Tracks search analytics
- ✅ Fixed field name mismatches (locationCity → location, salaryMin → compensationMin, etc.)

### Components
- ✅ No component changes needed (utilities handle tracking)

## 🔄 Backward Compatibility

All changes are **backward compatible**:
- ✅ Existing code continues to work
- ✅ New tables are optional (tracking happens automatically)
- ✅ No breaking changes to existing APIs
- ✅ Subscription is additive (one-time payments still work)

## 📈 Benefits

1. **Better Analytics**: Track job views, search patterns, match quality
2. **Better Performance**: Cached matches reduce computation
3. **Better UX**: Faster dashboard loading, better recommendations
4. **New Revenue Model**: Subscription support for recurring plans
5. **Product Insights**: Understand what users search for and click

## 🚀 Next Steps

1. **Run migrations**:
   ```bash
   npx prisma db push
   npm run prisma:generate
   ```

2. **Test the new features**:
   - View a job → Check JobView table
   - Search for jobs → Check SearchAnalytics table
   - View dashboard → Check JobMatch cache
   - Create subscription → Test subscription flow

3. **Optional**: Add subscription UI in employer dashboard
4. **Optional**: Add analytics dashboard showing job views and search data

## 📝 Notes

- All tracking is **non-blocking** (errors don't break functionality)
- JobMatch cache expires after 24 hours (auto-refreshes)
- SearchAnalytics tracks both logged-in and anonymous users
- Subscriptions work alongside one-time JobPayment (both supported)

