# Database Schema Analysis: Old vs New

## Current Schema (14 tables) ✅

Your current Prisma schema has:
- **Core**: User, CandidateProfile, EmployerProfile
- **Jobs**: Tier, Job, JobPayment
- **Applications**: Application, SavedJob, Resume
- **Communication**: Message, Notification, Interview
- **Analytics**: AnalyticsEvent, AuditLog

## Potentially Useful Tables from Old Schema

### 🔴 HIGH VALUE - Should Consider Adding

#### 1. **JobView** (from `job_views`)
**Purpose**: Track which jobs are viewed by candidates
**Why useful**: 
- Analytics on job popularity
- Track conversion (view → apply)
- Identify trending jobs
- Currently missing - only have generic AnalyticsEvent

**Suggested Schema**:
```prisma
model JobView {
  id        String   @id @default(cuid())
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  userId    String?  // Optional - track anonymous vs logged-in views
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  viewedAt DateTime @default(now())
  ipAddress String?  // For analytics
  userAgent String?  // For analytics
  
  @@index([jobId, viewedAt])
  @@index([userId])
}
```

#### 2. **JobMatch** (from `job_matches`)
**Purpose**: Store AI-generated job-candidate matches
**Why useful**:
- Cache expensive AI matching results
- Show "recommended for you" jobs
- Track match quality over time
- Currently done on-the-fly (expensive)

**Suggested Schema**:
```prisma
model JobMatch {
  id              String           @id @default(cuid())
  jobId           String
  job             Job              @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidateId    String
  candidate       CandidateProfile @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  matchScore     Float            // 0-100 match percentage
  matchReasonsJson String?        // JSON array of why it's a match
  aiGenerated     Boolean          @default(true)
  viewed          Boolean          @default(false)
  applied         Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([jobId, candidateId])
  @@index([candidateId, matchScore])
  @@index([jobId, matchScore])
}
```

#### 3. **SearchAnalytics** (from `search_analytics`)
**Purpose**: Track search queries and results
**Why useful**:
- Understand what users are looking for
- Improve search relevance
- Identify missing job categories
- Currently not tracked

**Suggested Schema**:
```prisma
model SearchAnalytics {
  id            String   @id @default(cuid())
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  query         String   // Search query
  filtersJson   String?  // JSON of applied filters
  resultsCount  Int      // How many results returned
  clickedJobId  String?  // If user clicked a result
  clickedJob    Job?     @relation(fields: [clickedJobId], references: [id], onDelete: SetNull)
  searchedAt    DateTime @default(now())
  
  @@index([userId, searchedAt])
  @@index([query])
}
```

### 🟡 MEDIUM VALUE - Nice to Have

#### 4. **Subscription** (from `subscriptions`)
**Purpose**: Recurring subscriptions for employers
**Why useful**:
- Monthly/annual subscription plans
- Currently only one-time JobPayment
- Could add subscription tiers

**Note**: Only add if you plan subscription model

#### 5. **UserActivityLog** (from `user_activity_logs`)
**Purpose**: Detailed user activity tracking
**Why useful**:
- More granular than AnalyticsEvent
- Track specific actions (page views, clicks, etc.)
- Better debugging and support

**Note**: AnalyticsEvent might be sufficient, but this is more detailed

#### 6. **DailyMetrics** (from `daily_metrics`)
**Purpose**: Pre-aggregated daily metrics
**Why useful**:
- Faster dashboard loading
- Historical trend analysis
- Reduce database load

**Note**: Can be generated from AnalyticsEvent, but pre-aggregation is faster

### 🟢 LOW VALUE - Probably Not Needed

#### 7. **SkillDemand** (from `skill_demand`)
- Can be generated from job postings
- AI can provide market insights on-demand
- Not critical

#### 8. **SalaryValidations** (from `salary_validations`)
- Salary data can be in Job table
- Market insights API can provide this
- Not critical

#### 9. **HealthcareCredentials** (from `healthcare_credentials`)
- Can be stored in CandidateProfile JSON fields
- Not critical for MVP

#### 10. **LicenseVerifications** (from `license_verifications`)
- Can be in CandidateProfile or Application
- Not critical for MVP

## Recommended Additions

### Priority 1: Add These Now
1. ✅ **JobView** - Essential for analytics
2. ✅ **JobMatch** - Improves performance and UX
3. ✅ **SearchAnalytics** - Valuable for product insights

### Priority 2: Add Later (if needed)
4. **Subscription** - Only if adding subscription model
5. **UserActivityLog** - If need more detailed tracking
6. **DailyMetrics** - If dashboard performance becomes issue

## Implementation Recommendation

**Start with Priority 1 tables** - they provide immediate value:
- Better analytics
- Better user experience (cached matches)
- Product insights (search data)

You can always add more later. The current 14 tables cover core functionality, but these 3 additions would significantly enhance the platform.

## Migration Strategy

1. **Keep current 14 tables** ✅
2. **Add 3 new tables** (JobView, JobMatch, SearchAnalytics)
3. **Drop old public schema** (cleanup)
4. **Total: 17 tables** (clean and focused)

Would you like me to create the updated Prisma schema with these additions?

