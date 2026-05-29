import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import TopNavigation from '@/components/top-navigation'
import DrawerNavigation from '@/components/drawer-navigation'
import ApprovalButtons from '@/components/admin-approval-buttons'
import StatCard from '@/components/dashboard/stat-card'
import ProfileStrengthMeter from '@/components/dashboard/profile-strength-meter'
import DashboardSection from '@/components/dashboard/dashboard-section'
import StatusPill from '@/components/dashboard/status-pill'
import { computeProfileCompleteness, type ProfileCompleteness } from '@/lib/profile-completeness'
import type {
  CandidateProfile,
  EmployerProfile,
  Application,
  Job,
  User,
  SavedJob,
  JobMatch,
} from '@prisma/client'

type CandidateWithUser = CandidateProfile & { user: Pick<User, 'email'> }
type EmployerWithUser = EmployerProfile & { user: Pick<User, 'email'> }
type ApplicationWithJob = Application & { job: Job & { employer: Pick<EmployerProfile, 'orgName'> } }
type EmployerJobSummary = Job & { _count: { applications: number; views: number } }
type PendingJobSummary = Job & { employer: Pick<EmployerProfile, 'orgName'> }
type SavedJobWithJob = SavedJob & { job: Job & { employer: Pick<EmployerProfile, 'orgName'> } }
type JobMatchWithJob = JobMatch & { job: Job & { employer: Pick<EmployerProfile, 'orgName'> } }
type RecentApplicant = Application & {
  job: Pick<Job, 'id' | 'title'>
  candidate: Pick<CandidateProfile, 'fullName'>
}

interface AdminStats {
  totalCandidates: number
  totalEmployers: number
  liveJobs: number
  totalApplications: number
}

interface CandidateStats {
  totalApplications: number
  applicationsThisMonth: number
  savedJobs: number
  newMatches: number
}

interface EmployerStats {
  liveJobs: number
  pendingJobs: number
  totalApplications: number
  applicationsThisWeek: number
  totalViews: number
}

type PrismaLikeError = {
  code?: string
  message?: string
}

function isDatabaseConnectionError(error: PrismaLikeError | undefined) {
  if (!error) return false
  // P1001: can't reach DB. P2024: timed out fetching a connection from the pool.
  // P2037: too many connections. All are transient connectivity issues we degrade on.
  return (
    error.code === 'P1001' ||
    error.code === 'P2024' ||
    error.code === 'P2037' ||
    (typeof error.message === 'string' &&
      (error.message.includes("Can't reach database server") ||
        error.message.includes('connection pool')))
  )
}

export default async function DashboardPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  let candidateProfile: CandidateWithUser | null = null
  let employerProfile: EmployerWithUser | null = null
  let jobs: EmployerJobSummary[] = []
  let applications: ApplicationWithJob[] = []
  let candidateStats: CandidateStats | null = null
  let profileCompleteness: ProfileCompleteness | null = null
  let employerStats: EmployerStats | null = null
  let savedJobsList: SavedJobWithJob[] = []
  let jobMatchesList: JobMatchWithJob[] = []
  let recentApplicants: RecentApplicant[] = []

  // Admin dashboard data
  let pendingEmployers: EmployerWithUser[] = []
  let pendingJobs: PendingJobSummary[] = []
  let stats: AdminStats | null = null
  let dbUnavailableMessage: string | null = null

  if (session.user.role === 'CANDIDATE' && session.user.candidateProfileId) {
    // Optimized query: candidate profile, recent applications and KPI counts in parallel
    const candidateId = session.user.candidateProfileId
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    try {
      const jobWithEmployerInclude = {
        job: {
          include: {
            employer: {
              select: { orgName: true },
            },
          },
        },
      }
      const [
        candidateResult,
        applicationsResult,
        totalApplications,
        applicationsThisMonth,
        savedJobs,
        newMatches,
        resumeCount,
        savedJobsResult,
        matchesResult,
      ] = await Promise.all([
        db.candidateProfile.findUnique({
          where: { id: candidateId },
          include: {
            user: {
              select: { email: true },
            },
          },
        }),
        db.application.findMany({
          where: { candidateId },
          include: jobWithEmployerInclude,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.application.count({ where: { candidateId } }),
        db.application.count({ where: { candidateId, createdAt: { gte: startOfMonth } } }),
        db.savedJob.count({ where: { candidateId } }),
        db.jobMatch.count({ where: { candidateId, viewed: false } }),
        db.resume.count({ where: { candidateId } }),
        db.savedJob.findMany({
          where: { candidateId },
          include: jobWithEmployerInclude,
          orderBy: { savedAt: 'desc' },
          take: 3,
        }),
        db.jobMatch.findMany({
          where: { candidateId },
          include: jobWithEmployerInclude,
          orderBy: { matchScore: 'desc' },
          take: 3,
        }),
      ])

      candidateProfile = candidateResult
      applications = applicationsResult
      candidateStats = { totalApplications, applicationsThisMonth, savedJobs, newMatches }
      profileCompleteness = computeProfileCompleteness(candidateResult, resumeCount)
      savedJobsList = savedJobsResult
      jobMatchesList = matchesResult
    } catch (error: unknown) {
      const maybe = error as PrismaLikeError
      if (isDatabaseConnectionError(maybe)) {
        dbUnavailableMessage = 'The dashboard is temporarily unavailable due to a database connection issue. Please refresh in a moment.'
      } else {
        throw error
      }
    }
  } else if (session.user.role === 'EMPLOYER' && session.user.employerProfileId) {
    // Optimized query: employer profile, recent jobs and KPI counts in parallel
    const employerId = session.user.employerProfileId
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    try {
      const [
        employerResult,
        jobsResult,
        liveJobs,
        pendingJobs,
        totalApplications,
        applicationsThisWeek,
        totalViews,
        recentApplicantsResult,
      ] = await Promise.all([
        db.employerProfile.findUnique({
          where: { id: employerId },
          include: {
            user: {
              select: { email: true },
            },
          },
        }),
        db.job.findMany({
          where: { employerId },
          include: {
            _count: {
              select: { applications: true, views: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.job.count({ where: { employerId, status: 'LIVE' } }),
        db.job.count({ where: { employerId, status: 'PENDING_ADMIN_REVIEW' } }),
        db.application.count({ where: { job: { employerId } } }),
        db.application.count({ where: { job: { employerId }, createdAt: { gte: weekAgo } } }),
        db.jobView.count({ where: { job: { employerId } } }),
        db.application.findMany({
          where: { job: { employerId } },
          include: {
            job: { select: { id: true, title: true } },
            candidate: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

      employerProfile = employerResult
      jobs = jobsResult
      employerStats = { liveJobs, pendingJobs, totalApplications, applicationsThisWeek, totalViews }
      recentApplicants = recentApplicantsResult
    } catch (error: unknown) {
      const maybe = error as PrismaLikeError
      if (isDatabaseConnectionError(maybe)) {
        dbUnavailableMessage = 'The dashboard is temporarily unavailable due to a database connection issue. Please refresh in a moment.'
      } else {
        throw error
      }
    }
  } else if (session.user.role === 'ADMIN') {
    // Optimized queries: get all admin data in parallel
    try {
      const [pendingEmployersResult, pendingJobsResult, statsResult] = await Promise.all([
        db.employerProfile.findMany({
          where: { adminApproved: false },
          include: {
            user: {
              select: { email: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        db.job.findMany({
          where: { status: 'PENDING_ADMIN_REVIEW' },
          include: {
            employer: {
              select: { orgName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        Promise.all([
          db.candidateProfile.count(),
          db.employerProfile.count(),
          db.job.count({ where: { status: 'LIVE' } }),
          db.application.count(),
        ]).then(([totalCandidates, totalEmployers, liveJobs, totalApplications]) => ({
          totalCandidates,
          totalEmployers,
          liveJobs,
          totalApplications
        }))
      ])
      
      pendingEmployers = pendingEmployersResult
      pendingJobs = pendingJobsResult
      stats = statsResult
    } catch (error: unknown) {
      const maybe = error as PrismaLikeError
      if (isDatabaseConnectionError(maybe)) {
        dbUnavailableMessage = 'The dashboard is temporarily unavailable due to a database connection issue. Please refresh in a moment.'
      } else {
        throw error
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative eeg-wallpaper">
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10 flex flex-col flex-1">
        <TopNavigation userRole={session.user.role} userEmail={session.user.email} />
        <div className="flex flex-1">
          <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
          <main className="flex-1 lg:ml-0">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
            <div className="mb-8" id="overview">
              <h1 className="text-4xl font-serif text-eeg-charcoal">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back,{' '}
                {session.user.role === 'CANDIDATE' && candidateProfile?.fullName
                  ? candidateProfile.fullName
                  : session.user.role === 'EMPLOYER' && employerProfile?.orgName
                  ? employerProfile.orgName
                  : session.user.role === 'ADMIN'
                  ? 'Admin'
                  : session.user.email}
              </p>
            </div>

            {/* Admin Dashboard */}
            {session.user.role === 'ADMIN' && (
              <div className="space-y-6">
                {dbUnavailableMessage && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded">
                    <p className="font-medium">Database connection issue</p>
                    <p className="text-sm mt-1">{dbUnavailableMessage}</p>
                    <p className="text-sm mt-1">
                      See <span className="font-mono">DATABASE_SETUP.md</span> for the correct Supabase Session Pooler connection string.
                    </p>
                  </div>
                )}
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats">
                  <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-neutral-600">Total Candidates</h3>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{stats?.totalCandidates || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-neutral-600">Total Employers</h3>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{stats?.totalEmployers || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-neutral-600">Live Jobs</h3>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{stats?.liveJobs || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-neutral-600">Applications</h3>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{stats?.totalApplications || 0}</p>
                  </div>
                </div>

                {/* Pending Employers */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200" id="pending-employers">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Pending Employer Approvals</h2>
                  {pendingEmployers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingEmployers.map((employer: EmployerWithUser) => (
                        <div key={employer.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{employer.orgName}</h3>
                              <p className="text-sm text-gray-600 mt-1">{employer.user.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Registered: {new Date(employer.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ApprovalButtons type="employer" id={employer.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No pending employer approvals</p>
                  )}
                </div>

                {/* Pending Jobs */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200" id="pending-jobs">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Pending Job Approvals</h2>
                  {pendingJobs.length > 0 ? (
                    <div className="space-y-4">
                      {pendingJobs.map((job: PendingJobSummary) => (
                        <div key={job.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{job.employer?.orgName || 'Unknown Employer'} • {job.level}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted: {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ApprovalButtons type="job" id={job.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No pending job approvals</p>
                  )}
                </div>
              </div>
            )}

            {/* Candidate Dashboard */}
            {session.user.role === 'CANDIDATE' && (
              <div className="space-y-6">
                {/* KPI row */}
                {candidateStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      label="Applications"
                      value={candidateStats.totalApplications}
                      hint={`${candidateStats.applicationsThisMonth} this month`}
                      accent="blue"
                      href="/dashboard/applications"
                    />
                    <StatCard
                      label="Saved Jobs"
                      value={candidateStats.savedJobs}
                      hint="Roles you bookmarked"
                      href="/dashboard/saved"
                    />
                    <StatCard
                      label="Job Matches"
                      value={candidateStats.newMatches}
                      hint={candidateStats.newMatches > 0 ? 'New for you' : 'All caught up'}
                      accent={candidateStats.newMatches > 0 ? 'green' : 'default'}
                      href="/dashboard/ai"
                    />
                    {profileCompleteness && (
                      <ProfileStrengthMeter completeness={profileCompleteness} />
                    )}
                  </div>
                )}

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Your Profile</h2>
                  {candidateProfile ? (
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium text-gray-700">Name:</span>{' '}
                        <span className="text-gray-900">{candidateProfile.fullName}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Email:</span>{' '}
                        <span className="text-gray-900">{candidateProfile.user?.email || session.user.email}</span>
                      </p>
                      <Link
                        href="/dashboard/profile"
                        className="inline-block mt-4 text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                      >
                        Edit Profile →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">Complete your profile to get started</p>
                      <Link
                        href="/dashboard/profile"
                        className="inline-block px-6 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                      >
                        Complete Profile
                      </Link>
                    </div>
                  )}
                </div>

                <DashboardSection
                  title="Recent Applications"
                  count={candidateStats ? `${candidateStats.totalApplications} total` : undefined}
                  actionHref="/dashboard/applications"
                >
                  {applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.map((app: ApplicationWithJob) => (
                        <div
                          key={app.id}
                          className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            {app.job?.id ? (
                              <Link
                                href={`/jobs/${app.job.id}`}
                                className="font-semibold text-gray-900 hover:text-eeg-blue-electric"
                              >
                                {app.job.title}
                              </Link>
                            ) : (
                              <h3 className="font-semibold text-gray-900">Unknown Job</h3>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              {app.job?.employer?.orgName || 'Unknown Employer'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusPill status={app.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No applications yet</p>
                  )}
                </DashboardSection>

                <DashboardSection
                  title="Recommended for You"
                  actionHref="/dashboard/ai"
                  actionLabel="See all matches"
                >
                  {jobMatchesList.length > 0 ? (
                    <div className="space-y-4">
                      {jobMatchesList.map((match: JobMatchWithJob) => (
                        <div
                          key={match.id}
                          className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <Link
                              href={`/jobs/${match.job.id}`}
                              className="font-semibold text-gray-900 hover:text-eeg-blue-electric"
                            >
                              {match.job.title}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              {match.job.employer?.orgName || 'Unknown Employer'}
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            {Math.round(match.matchScore)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No matches yet — complete your profile to get matched with roles.
                    </p>
                  )}
                </DashboardSection>

                <DashboardSection
                  title="Saved Jobs"
                  count={
                    candidateStats && candidateStats.savedJobs > 0
                      ? `${candidateStats.savedJobs} total`
                      : undefined
                  }
                  actionHref="/dashboard/saved"
                >
                  {savedJobsList.length > 0 ? (
                    <div className="space-y-4">
                      {savedJobsList.map((saved: SavedJobWithJob) => (
                        <div
                          key={saved.id}
                          className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <Link
                              href={`/jobs/${saved.job.id}`}
                              className="font-semibold text-gray-900 hover:text-eeg-blue-electric"
                            >
                              {saved.job.title}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              {saved.job.employer?.orgName || 'Unknown Employer'}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-gray-500">
                            Saved {new Date(saved.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No saved jobs yet. Browse roles and tap the save icon to bookmark them.
                    </p>
                  )}
                </DashboardSection>
              </div>
            )}

            {/* Employer Dashboard */}
            {session.user.role === 'EMPLOYER' && (
              <div className="space-y-6">
                {/* KPI row */}
                {employerStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      label="Live Jobs"
                      value={employerStats.liveJobs}
                      hint={`${employerStats.pendingJobs} pending review`}
                      accent="green"
                      href="/dashboard/jobs"
                    />
                    <StatCard
                      label="Total Applications"
                      value={employerStats.totalApplications}
                      hint={`${employerStats.applicationsThisWeek} new this week`}
                      accent="blue"
                      href="/dashboard/applications"
                    />
                    <StatCard
                      label="Total Views"
                      value={employerStats.totalViews}
                      hint="Across all your jobs"
                    />
                    <StatCard
                      label="View → Apply"
                      value={`${
                        employerStats.totalViews > 0
                          ? Math.round((employerStats.totalApplications / employerStats.totalViews) * 100)
                          : 0
                      }%`}
                      hint="Conversion rate"
                      accent="amber"
                    />
                  </div>
                )}

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Company Profile</h2>
                  {employerProfile ? (
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium text-gray-700">Organization:</span>{' '}
                        <span className="text-gray-900">{employerProfile.orgName}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Email:</span>{' '}
                        <span className="text-gray-900">{employerProfile.user?.email || session.user.email}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Status:</span>{' '}
                        {employerProfile.adminApproved ? (
                          <span className="text-green-600 font-medium">✓ Approved</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">⏳ Pending Approval</span>
                        )}
                      </p>
                      {!employerProfile.adminApproved && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Your employer account is pending approval. You cannot post jobs until approved by an administrator.
                          </p>
                        </div>
                      )}
                      <Link
                        href="/dashboard/profile"
                        className="inline-block mt-4 text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                      >
                        Edit Profile →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">Complete your company profile</p>
                      <Link
                        href="/dashboard/profile"
                        className="inline-block px-6 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                      >
                        Complete Profile
                      </Link>
                    </div>
                  )}
                </div>

                <DashboardSection
                  title="Your Job Postings"
                  actionHref={employerProfile?.adminApproved ? '/dashboard/jobs/new' : undefined}
                  actionLabel="Post new job"
                >
                  {jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.map((job: EmployerJobSummary) => {
                        const views = job._count?.views || 0
                        const apps = job._count?.applications || 0
                        const conv = views > 0 ? Math.round((apps / views) * 100) : 0
                        return (
                          <div
                            key={job.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                          >
                            <div>
                              <Link
                                href={`/jobs/${job.id}`}
                                className="font-semibold text-gray-900 hover:text-eeg-blue-electric"
                              >
                                {job.title}
                              </Link>
                              <p className="text-xs text-gray-500 mt-1">
                                Posted {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                {views} views · {apps} apps · {conv}%
                              </span>
                              <StatusPill status={job.status} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No job postings yet</p>
                  )}
                </DashboardSection>

                <DashboardSection
                  title="Recent Applicants"
                  count={
                    employerStats && employerStats.totalApplications > 0
                      ? `${employerStats.totalApplications} total`
                      : undefined
                  }
                  actionHref="/dashboard/applications"
                >
                  {recentApplicants.length > 0 ? (
                    <div className="space-y-4">
                      {recentApplicants.map((app: RecentApplicant) => (
                        <div
                          key={app.id}
                          className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {app.candidate?.fullName || 'Candidate'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Applied to{' '}
                              {app.job?.id ? (
                                <Link
                                  href={`/jobs/${app.job.id}`}
                                  className="font-medium text-eeg-blue-electric hover:text-eeg-blue-600"
                                >
                                  {app.job.title}
                                </Link>
                              ) : (
                                'a role'
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusPill status={app.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No applicants yet</p>
                  )}
                </DashboardSection>
              </div>
            )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
