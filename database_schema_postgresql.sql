-- Executive Elite Group v5 - Database Schema
-- PostgreSQL Database Schema (for Supabase/PostgreSQL)
-- Generated from Prisma schema

-- ============================================
-- TABLE: User
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: CandidateProfile
-- ============================================
CREATE TABLE IF NOT EXISTS "CandidateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "fullName" TEXT NOT NULL,
    "currentTitle" TEXT,
    "currentOrg" TEXT,
    "primaryLocation" TEXT,
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "relocationRegionsJson" TEXT,
    "preferredSettingsJson" TEXT,
    "preferredEmploymentType" TEXT,
    "targetLevelsJson" TEXT,
    "budgetManagedMin" INTEGER,
    "budgetManagedMax" INTEGER,
    "teamSizeMin" INTEGER,
    "teamSizeMax" INTEGER,
    "primaryServiceLinesJson" TEXT,
    "ehrExperienceJson" TEXT,
    "regulatoryExperienceJson" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: EmployerProfile
-- ============================================
CREATE TABLE IF NOT EXISTS "EmployerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "orgName" TEXT NOT NULL,
    "orgType" TEXT NOT NULL DEFAULT 'OTHER',
    "hqLocation" TEXT,
    "website" TEXT,
    "about" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "EmployerProfile_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- ============================================
-- TABLE: Tier
-- ============================================
CREATE TABLE IF NOT EXISTS "Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "durationDays" INTEGER NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: Job
-- ============================================
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'DIRECTOR',
    "orgNameOverride" TEXT,
    "location" TEXT NOT NULL,
    "remoteAllowed" BOOLEAN NOT NULL DEFAULT false,
    "compensationMin" INTEGER,
    "compensationMax" INTEGER,
    "compensationCurrency" TEXT,
    "descriptionRich" TEXT NOT NULL,
    "keyResponsibilitiesJson" TEXT,
    "requiredExperienceYears" INTEGER,
    "requiredLicensesJson" TEXT,
    "requiredCertificationsJson" TEXT,
    "requiredEhrExperienceJson" TEXT,
    "requiredSettingExperienceJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ADMIN_REVIEW',
    "tierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "Job_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
);

-- ============================================
-- TABLE: JobPayment
-- ============================================
CREATE TABLE IF NOT EXISTS "JobPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobPayment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    CONSTRAINT "JobPayment_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "JobPayment_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
);

-- ============================================
-- TABLE: Application
-- ============================================
CREATE TABLE IF NOT EXISTS "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "candidateNote" TEXT,
    "employerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: Resume
-- ============================================
CREATE TABLE IF NOT EXISTS "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Resume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: SavedJob
-- ============================================
CREATE TABLE IF NOT EXISTS "SavedJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedJob_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: AuditLog
-- ============================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detailsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- ============================================
-- TABLE: AnalyticsEvent
-- ============================================
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: Notification
-- ============================================
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "linkUrl" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: Message
-- ============================================
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL_INQUIRY',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "parentMessageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL,
    CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE SET NULL
);

-- ============================================
-- TABLE: Interview
-- ============================================
CREATE TABLE IF NOT EXISTS "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "durationMinutes" INTEGER DEFAULT 60,
    "interviewerName" TEXT,
    "interviewerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

-- Notification indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Message indexes
CREATE INDEX IF NOT EXISTS "Message_senderId_sentAt_idx" ON "Message"("senderId", "sentAt");
CREATE INDEX IF NOT EXISTS "Message_recipientId_read_sentAt_idx" ON "Message"("recipientId", "read", "sentAt");
CREATE INDEX IF NOT EXISTS "Message_applicationId_idx" ON "Message"("applicationId");

-- Interview indexes
CREATE INDEX IF NOT EXISTS "Interview_applicationId_idx" ON "Interview"("applicationId");
CREATE INDEX IF NOT EXISTS "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- ============================================
-- TABLE: JobView
-- ============================================
CREATE TABLE IF NOT EXISTS "JobView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "JobView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    CONSTRAINT "JobView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "JobView_jobId_viewedAt_idx" ON "JobView"("jobId", "viewedAt");
CREATE INDEX IF NOT EXISTS "JobView_userId_idx" ON "JobView"("userId");

-- ============================================
-- TABLE: JobMatch
-- ============================================
CREATE TABLE IF NOT EXISTS "JobMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchReasonsJson" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    CONSTRAINT "JobMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "JobMatch_jobId_candidateId_key" UNIQUE("jobId", "candidateId")
);

CREATE INDEX IF NOT EXISTS "JobMatch_candidateId_matchScore_idx" ON "JobMatch"("candidateId", "matchScore");
CREATE INDEX IF NOT EXISTS "JobMatch_jobId_matchScore_idx" ON "JobMatch"("jobId", "matchScore");

-- ============================================
-- TABLE: SearchAnalytics
-- ============================================
CREATE TABLE IF NOT EXISTS "SearchAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "filtersJson" TEXT,
    "resultsCount" INTEGER NOT NULL,
    "clickedJobId" TEXT,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
    CONSTRAINT "SearchAnalytics_clickedJobId_fkey" FOREIGN KEY ("clickedJobId") REFERENCES "Job"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "SearchAnalytics_userId_searchedAt_idx" ON "SearchAnalytics"("userId", "searchedAt");
CREATE INDEX IF NOT EXISTS "SearchAnalytics_query_idx" ON "SearchAnalytics"("query");

-- ============================================
-- TABLE: Subscription
-- ============================================
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT UNIQUE,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Subscription_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "Subscription_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
);

CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_employerId_idx" ON "Subscription"("employerId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- ============================================
-- NOTES
-- ============================================
-- 
-- Enum Values Reference:
-- 
-- UserRole: CANDIDATE, EMPLOYER, ADMIN
-- UserStatus: ACTIVE, INACTIVE, SUSPENDED
-- JobLevel: C_SUITE, VP, DIRECTOR, MANAGER, OTHER_EXECUTIVE
-- OrgType: HEALTH_SYSTEM, HOSPICE, LTC, HOME_CARE, POST_ACUTE, OTHER
-- JobStatus: PENDING_ADMIN_REVIEW, APPROVED, REJECTED, DRAFT, CLOSED
-- ApplicationStatus: SUBMITTED, REVIEWING, INTERVIEWING, OFFERED, ACCEPTED, REJECTED, WITHDRAWN
-- NotificationType: APPLICATION_RECEIVED, APPLICATION_STATUS_CHANGED, JOB_APPROVED, JOB_REJECTED, 
--                  EMPLOYER_APPROVED, EMPLOYER_REJECTED, NEW_MESSAGE, INTERVIEW_SCHEDULED, 
--                  INTERVIEW_UPDATED, JOB_MATCH
-- MessageType: APPLICATION_INQUIRY, GENERAL_INQUIRY, INTERVIEW_FOLLOWUP, OFFER_DISCUSSION
-- InterviewStatus: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW
-- PaymentStatus: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
--
-- PostgreSQL-specific notes:
-- - BOOLEAN fields use true/false (not 0/1 like SQLite)
-- - TIMESTAMP(3) provides millisecond precision (matching Prisma's DateTime)
-- - Foreign keys are enforced by default in PostgreSQL (no PRAGMA needed)
-- - TEXT type is used for all string fields (PostgreSQL handles this efficiently)
-- - All foreign key constraints are explicitly named for easier management
--
-- Foreign Key Constraints:
-- - All foreign keys have appropriate ON DELETE actions (CASCADE or SET NULL)
-- - Unique constraints are enforced on userId fields in profile tables
-- - Email is unique in User table
--

