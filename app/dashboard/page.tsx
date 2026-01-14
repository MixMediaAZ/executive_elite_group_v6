import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import TopNavigation from '@/components/top-navigation'
import DrawerNavigation from '@/components/drawer-navigation'
import ApprovalButtons from '@/components/admin-approval-buttons'
import type { CandidateProfile, EmployerProfile, Application, Job, User } from '@prisma/client'

type CandidateWithUser = CandidateProfile & { user: Pick<User, 'email'> }
type EmployerWithUser = EmployerProfile & { user: Pick<User, 'email'> }
type ApplicationWithJob = Application & { job: Job & { employer: Pick<EmployerProfile, 'orgName'> } }
type EmployerJobSummary = Job & { _count: { applications: number } }
type PendingJobSummary = Job & { employer: Pick<EmployerProfile, 'orgName'> }

interface AdminStats {
  totalCandidates: number
  totalEmployers: number
  liveJobs: number
  totalApplications: number
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

  // Admin dashboard data
  let pendingEmployers: EmployerWithUser[] = []
  let pendingJobs: PendingJobSummary[] = []
  let stats: AdminStats | null = null

  if (session.user.role === 'CANDIDATE' && session.user.candidateProfileId) {
    // Optimized query: get candidate profile and recent applications in parallel
    const [candidateResult, applicationsResult] = await Promise.all([
      db.candidateProfile.findUnique({
        where: { id: session.user.candidateProfileId },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
      db.application.findMany({
        where: { candidateId: session.user.candidateProfileId },
        include: {
          job: {
            include: {
              employer: {
                select: { orgName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    ])
    
    candidateProfile = candidateResult
    applications = applicationsResult
  } else if (session.user.role === 'EMPLOYER' && session.user.employerProfileId) {
    // Optimized query: get employer profile and recent jobs in parallel
    const [employerResult, jobsResult] = await Promise.all([
      db.employerProfile.findUnique({
        where: { id: session.user.employerProfileId },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
      db.job.findMany({
        where: { employerId: session.user.employerProfileId },
        include: {
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    ])
    
    employerProfile = employerResult
    jobs = jobsResult
  } else if (session.user.role === 'ADMIN') {
    // Optimized queries: get all admin data in parallel
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
                Welcome back, {session.user.email}
              </p>
            </div>

            {/* Admin Dashboard */}
            {session.user.role === 'ADMIN' && (
              <div className="space-y-6">
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
                              <p className="text-sm text-gray-600 mt-1">{job.employer.orgName} • {job.level}</p>
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
                        <span className="text-gray-900">{candidateProfile.user.email}</span>
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

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Recent Applications</h2>
                  {applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.map((app: ApplicationWithJob) => (
                        <div key={app.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {app.job.employer.orgName} • Status: <span className="font-medium">{app.status}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No applications yet</p>
                  )}
                  <Link
                    href="/dashboard/applications"
                    className="inline-block mt-4 text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                  >
                    View All Applications →
                  </Link>
                </div>
              </div>
            )}

            {/* Employer Dashboard */}
            {session.user.role === 'EMPLOYER' && (
              <div className="space-y-6">
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
                        <span className="text-gray-900">{employerProfile.user.email}</span>
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

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Your Job Postings</h2>
                  {jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.map((job: EmployerJobSummary) => (
                        <div key={job.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className="font-medium">{job.status}</span> • {job._count.applications} applications
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No job postings yet</p>
                  )}
                  {employerProfile?.adminApproved && (
                    <Link
                      href="/dashboard/jobs/new"
                      className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      Post New Job
                    </Link>
                  )}
                </div>
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
