import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import DrawerNavigation from '@/components/drawer-navigation'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import ScheduleInterviewButton from '@/components/schedule-interview-button'
import Breadcrumb from '@/components/breadcrumb'
import ApplicationFilters from '@/components/application-filters'

type CandidateApplication = Prisma.ApplicationGetPayload<{
  include: {
    job: {
      include: {
        employer: {
          select: { orgName: true }
        }
      }
    }
  }
}>

type EmployerApplication = Prisma.ApplicationGetPayload<{
  include: {
    job: { select: { title: true } }
    candidate: {
      select: {
        fullName: true
        currentTitle: true
        user: { select: { email: true } }
        resumes: {
          select: {
            id: true,
            fileUrl: true,
            isPrimary: true,
          },
          where: { isPrimary: true },
          take: 1,
        }
      }
    }
  }
}>

interface ApplicationsPageProps {
  searchParams: {
    jobId?: string
    status?: string
    search?: string
  }
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  const isCandidate = session.user.role === 'CANDIDATE'
  const { jobId, status, search } = searchParams
  let candidateApplications: CandidateApplication[] = []
  let employerApplications: EmployerApplication[] = []
  let filteredJobTitle: string | null = null
  let employerJobs: Array<{ id: string; title: string }> = []

  // Build where clause for filtering
  const buildWhereClause = (baseWhere: Prisma.ApplicationWhereInput) => {
    const where: Prisma.ApplicationWhereInput = { ...baseWhere }
    
    if (jobId) {
      where.jobId = jobId
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      if (isCandidate) {
        // For candidates, search in job title or employer name
        where.OR = [
          { job: { title: { contains: search } } },
          { job: { employer: { orgName: { contains: search } } } },
        ]
      } else {
        // For employers, search in candidate name or email
        where.OR = [
          { candidate: { fullName: { contains: search } } },
          { candidate: { user: { email: { contains: search } } } },
        ]
      }
    }
    
    return where
  }

  if (isCandidate && session.user.candidateProfileId) {
    candidateApplications = await db.application.findMany({
      where: buildWhereClause({
        candidateId: session.user.candidateProfileId,
      }),
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
    })
  } else if (!isCandidate && session.user.employerProfileId) {
    employerJobs = await db.job.findMany({
      where: { employerId: session.user.employerProfileId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    })

    const jobIds = employerJobs.map((job: { id: string }) => job.id)
    
    // If filtering by jobId, verify it belongs to this employer
    if (jobId && jobIds.includes(jobId)) {
      const job = employerJobs.find((j: { id: string }) => j.id === jobId)
      filteredJobTitle = job?.title || null
    }

    employerApplications = await db.application.findMany({
      where: buildWhereClause({
        jobId: { in: jobIds },
      }),
      include: {
        job: {
          select: { title: true },
        },
        candidate: {
          select: {
            fullName: true,
            currentTitle: true,
            user: {
              select: { email: true },
            },
            resumes: {
              select: {
                id: true,
                fileUrl: true,
                isPrimary: true,
              },
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    redirect('/dashboard')
  }

  const hasNoApplications = isCandidate
    ? candidateApplications.length === 0
    : employerApplications.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      
      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: session.user.role === 'CANDIDATE' ? 'My Applications' : 'Job Applications' },
                ...(filteredJobTitle ? [{ label: filteredJobTitle }] : []),
              ]}
            />
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-serif text-eeg-charcoal">
                {session.user.role === 'CANDIDATE' ? 'My Applications' : 'Job Applications'}
              </h1>
              {jobId && filteredJobTitle && (
                <Link
                  href="/dashboard/applications"
                  className="text-sm text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                >
                  Clear Filter
                </Link>
              )}
            </div>
            {filteredJobTitle && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Showing applications for: <span className="font-semibold">{filteredJobTitle}</span>
                </p>
              </div>
            )}

            {/* Filters */}
            <ApplicationFilters
              userRole={session.user.role as 'CANDIDATE' | 'EMPLOYER'}
              jobs={!isCandidate ? employerJobs : undefined}
            />

            {hasNoApplications ? (
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 text-center text-gray-600">
                No applications found.
              </div>
            ) : (
              <div className="space-y-4">
                {isCandidate
                  ? candidateApplications.map((app: CandidateApplication) => (
                      <div key={app.id} className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <h3 className="text-xl font-serif text-eeg-charcoal mb-2">{app.job.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {app.job.employer.orgName}
                        </p>
                        <p className="text-sm">
                          Status: <span className="font-medium">{app.status}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          href={`/dashboard/jobs/${app.job.id}`}
                          className="inline-block mt-4 text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
                        >
                          View Job →
                        </Link>
                      </div>
                    ))
                  : employerApplications.map((app: EmployerApplication) => (
                      <div key={app.id} className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <h3 className="text-xl font-serif text-eeg-charcoal mb-2">
                          {app.candidate.fullName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {app.job.title} • {app.candidate.currentTitle || 'No title'}
                        </p>
                        <p className="text-sm">
                          Status: <span className="font-medium">{app.status}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Email: {app.candidate.user.email}
                        </p>
                        {app.candidateNote && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{app.candidateNote}</p>
                          </div>
                        )}
                        {app.candidate.resumes && app.candidate.resumes.length > 0 && (
                          <div className="mt-4">
                            <a
                              href={app.candidate.resumes[0].fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-eeg-blue-electric text-white rounded-lg hover:bg-eeg-blue-600 transition-colors font-medium text-sm"
                            >
                              📄 View Resume
                            </a>
                          </div>
                        )}
                        {app.status === 'SUBMITTED' && (
                          <div className="mt-4">
                            <ScheduleInterviewButton
                              applicationId={app.id}
                              jobTitle={app.job.title}
                            />
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

