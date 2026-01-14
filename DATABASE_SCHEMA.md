# Database Schema Overview

This document describes all tables and enums that will be created in your fresh Supabase database.

## 📊 Tables Created

### Core Tables

#### `User`
- **Purpose**: User accounts (candidates, employers, admins)
- **Key Fields**: `id`, `email`, `passwordHash`, `role`, `status`
- **Relations**: Links to `CandidateProfile` and `EmployerProfile`

#### `CandidateProfile`
- **Purpose**: Detailed candidate information
- **Key Fields**: `firstName`, `lastName`, `currentTitle`, `yearsExperience`, `summary`
- **Healthcare Fields**: `teamSizeManagedMin/Max`, `budgetManagedMin/Max`, `ehrExperience`, `regulatoryExperience`
- **Relations**: One-to-one with `User`, one-to-many with `Resume`, `Application`, `SavedJob`

#### `EmployerProfile`
- **Purpose**: Employer/company information
- **Key Fields**: `organizationName`, `orgType`, `description`, `approved`
- **Relations**: One-to-one with `User`, one-to-many with `Job`, `JobPayment`

### Job Posting Tables

#### `Tier`
- **Purpose**: Job posting pricing tiers
- **Key Fields**: `name`, `priceCents`, `durationDays`, `isFeatured`, `isPremium`
- **Default Tiers**: Standard ($299), Featured ($499), Premium ($799)

#### `Job`
- **Purpose**: Job postings
- **Key Fields**: `title`, `level`, `department`, `locationCity/State/Country`, `salaryMin/Max`, `descriptionRich`, `status`
- **Healthcare Fields**: `requiredEhrExperience`, `requiredSettingExperience`, `requiredLicenses`
- **Relations**: Belongs to `EmployerProfile` and `Tier`, has many `Application`, `SavedJob`, `JobPayment`

#### `JobPayment`
- **Purpose**: Payment records for job postings
- **Key Fields**: `amountCents`, `stripePaymentIntentId`, `status`, `paidAt`
- **Relations**: Belongs to `Job`, `EmployerProfile`, `Tier`

### Application Tables

#### `Application`
- **Purpose**: Job applications from candidates
- **Key Fields**: `status`, `candidateMessage`, `employerInternalNotes`, `submittedAt`
- **Relations**: Belongs to `Job` and `CandidateProfile`

#### `SavedJob`
- **Purpose**: Jobs saved by candidates
- **Key Fields**: `savedAt`
- **Relations**: Belongs to `Job` and `CandidateProfile`

### Resume Table

#### `Resume`
- **Purpose**: Resume file uploads
- **Key Fields**: `fileUrl`, `fileName`, `fileMimeType`, `isPrimary`, `uploadedAt`
- **Relations**: Belongs to `CandidateProfile`

### Admin & Analytics Tables

#### `AuditLog`
- **Purpose**: Admin action logging
- **Key Fields**: `action`, `targetType`, `targetId`, `details`, `createdAt`
- **Relations**: Belongs to `User` (admin)

#### `AnalyticsEvent`
- **Purpose**: Analytics tracking
- **Key Fields**: `eventType`, `metadata`, `createdAt`
- **Optional Relations**: Can reference `userId`, `employerId`, `candidateId`, `jobId`

## 🔢 Enums Created

### `UserRole`
- `CANDIDATE` - Job seeker
- `EMPLOYER` - Company posting jobs
- `ADMIN` - System administrator

### `UserStatus`
- `ACTIVE` - User can log in
- `SUSPENDED` - User account suspended

### `JobStatus`
- `DRAFT` - Job not yet submitted
- `PENDING_ADMIN_REVIEW` - Waiting for admin approval
- `LIVE` - Active job posting
- `SUSPENDED` - Temporarily suspended
- `CLOSED` - Job posting closed

### `JobLevel`
- `C_SUITE` - C-Suite executives
- `VP` - Vice President
- `DIRECTOR` - Director level
- `MANAGER` - Manager level
- `OTHER_EXECUTIVE` - Other executive roles

### `ApplicationStatus`
- `SUBMITTED` - Application submitted
- `UNDER_REVIEW` - Being reviewed
- `INTERVIEW` - Interview scheduled
- `OFFER` - Offer extended
- `REJECTED` - Application rejected
- `WITHDRAWN` - Application withdrawn

### `OrgType`
- `HEALTH_SYSTEM` - Health system
- `HOSPICE` - Hospice care
- `LTC` - Long-term care
- `HOME_CARE` - Home care
- `POST_ACUTE` - Post-acute care
- `OTHER` - Other healthcare organization

## 🔗 Key Relationships

```
User
├── CandidateProfile (1:1)
│   ├── Resume (1:many)
│   ├── Application (1:many)
│   └── SavedJob (1:many)
│
└── EmployerProfile (1:1)
    └── Job (1:many)
        ├── Application (1:many)
        ├── SavedJob (1:many)
        └── JobPayment (1:many)
            └── Tier (many:1)
```

## 📝 Notes

- All IDs use `cuid()` for unique identifiers
- All tables have `createdAt` and `updatedAt` timestamps
- Cascade deletes ensure data integrity (e.g., deleting a User deletes their profile)
- JSON fields (`Json?`) store flexible data like EHR experience, regulatory experience, etc.
- Foreign key constraints ensure referential integrity

## 🚀 After Setup

Once you run `npm run db:setup`, all these tables and enums will be created in your Supabase database, and default job tiers will be seeded.

