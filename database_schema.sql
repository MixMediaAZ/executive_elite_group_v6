-- Executive Elite Group v5 - Database Schema
-- SQLite Database Schema
-- Generated from Prisma schema

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- TABLE: User
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "willingToRelocate" INTEGER NOT NULL DEFAULT 0,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
    "adminApproved" INTEGER NOT NULL DEFAULT 0,
    "approvedByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL
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
    "isFeatured" INTEGER NOT NULL DEFAULT 0,
    "isPremium" INTEGER NOT NULL DEFAULT 0,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "remoteAllowed" INTEGER NOT NULL DEFAULT 0,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
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
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
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
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimary" INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE
);

-- ============================================
-- TABLE: SavedJob
-- ============================================
CREATE TABLE IF NOT EXISTS "SavedJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- ============================================
-- TABLE: AnalyticsEvent
-- ============================================
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "read" INTEGER NOT NULL DEFAULT 0,
    "readAt" DATETIME,
    "linkUrl" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
    "read" INTEGER NOT NULL DEFAULT 0,
    "readAt" DATETIME,
    "parentMessageId" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL,
    FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE SET NULL
);

-- ============================================
-- TABLE: Interview
-- ============================================
CREATE TABLE IF NOT EXISTS "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "durationMinutes" INTEGER DEFAULT 60,
    "interviewerName" TEXT,
    "interviewerEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE
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
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
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
    "matchScore" REAL NOT NULL,
    "matchReasonsJson" TEXT,
    "aiGenerated" INTEGER NOT NULL DEFAULT 1,
    "viewed" INTEGER NOT NULL DEFAULT 0,
    "applied" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
    FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,
    UNIQUE("jobId", "candidateId")
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
    "searchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
    FOREIGN KEY ("clickedJobId") REFERENCES "Job"("id") ON DELETE SET NULL
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
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" DATETIME,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tierId") REFERENCES "Tier"("id")
);

CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_employerId_idx" ON "Subscription"("employerId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- ============================================
-- TRIGGERS for updatedAt fields
-- ============================================

-- User table trigger
CREATE TRIGGER IF NOT EXISTS "User_updatedAt" 
AFTER UPDATE ON "User"
BEGIN
    UPDATE "User" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- CandidateProfile table trigger
CREATE TRIGGER IF NOT EXISTS "CandidateProfile_updatedAt" 
AFTER UPDATE ON "CandidateProfile"
BEGIN
    UPDATE "CandidateProfile" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- EmployerProfile table trigger
CREATE TRIGGER IF NOT EXISTS "EmployerProfile_updatedAt" 
AFTER UPDATE ON "EmployerProfile"
BEGIN
    UPDATE "EmployerProfile" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- Tier table trigger
CREATE TRIGGER IF NOT EXISTS "Tier_updatedAt" 
AFTER UPDATE ON "Tier"
BEGIN
    UPDATE "Tier" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- Job table trigger
CREATE TRIGGER IF NOT EXISTS "Job_updatedAt" 
AFTER UPDATE ON "Job"
BEGIN
    UPDATE "Job" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- JobPayment table trigger
CREATE TRIGGER IF NOT EXISTS "JobPayment_updatedAt" 
AFTER UPDATE ON "JobPayment"
BEGIN
    UPDATE "JobPayment" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- Application table trigger
CREATE TRIGGER IF NOT EXISTS "Application_updatedAt" 
AFTER UPDATE ON "Application"
BEGIN
    UPDATE "Application" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- Interview table trigger
CREATE TRIGGER IF NOT EXISTS "Interview_updatedAt" 
AFTER UPDATE ON "Interview"
BEGIN
    UPDATE "Interview" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- JobMatch table trigger
CREATE TRIGGER IF NOT EXISTS "JobMatch_updatedAt" 
AFTER UPDATE ON "JobMatch"
BEGIN
    UPDATE "JobMatch" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

-- Subscription table trigger
CREATE TRIGGER IF NOT EXISTS "Subscription_updatedAt" 
AFTER UPDATE ON "Subscription"
BEGIN
    UPDATE "Subscription" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;

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
-- Boolean fields are stored as INTEGER (0 = false, 1 = true) in SQLite
-- DateTime fields use DATETIME type with ISO8601 format
-- JSON fields are stored as TEXT and should be parsed/stringified in application code
--
-- Foreign Key Constraints:
-- - All foreign keys have appropriate ON DELETE actions (CASCADE or SET NULL)
-- - Unique constraints are enforced on userId fields in profile tables
-- - Email is unique in User table
--
