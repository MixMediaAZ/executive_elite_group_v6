import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { trackJobView } from '@/lib/job-tracking'
import Link from 'next/link'
import DrawerNavigation from '@/components/drawer-navigation'
import JobApplyButton from '@/components/job-apply-button'
import JobSaveButton from '@/components/job-save-button'
import Breadcrumb from '@/components/breadcrumb'
import { headers } from 'next/headers'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSessionHelper()
  const headersList = await headers()

  if (!session) {
    redirect('/auth/login')
  }

  const job = await db.job.findUnique({
    where: { id: params.id },
    include: {
      employer: {
        select: {
          orgName: true,
          orgType: true,
          about: true,
          website: true,
          userId: true,
        },
      },
      tier: {
        select: {
          name: true,
        },
      },
      payments: {
        where: { status: 'paid' },
        take: 1,
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  })

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-eeg-charcoal mb-4">Job Not Found</h1>
          <Link href="/dashboard/jobs" className="text-eeg-blue-electric hover:text-eeg-blue-600 font-medium">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const hasApplied = session.user.role === 'CANDIDATE' && session.user.candidateProfileId
    ? await db.application.findFirst({
        where: {
          jobId: job.id,
          candidateId: session.user.candidateProfileId,
        },
      })
    : null

  const isJobOwner = session.user.role === 'EMPLOYER' && job.employer.userId === session.user.id
  const hasPayment = job.payments.length > 0

  // Track job view (only for candidates viewing jobs)
  if (session.user.role === 'CANDIDATE') {
    await trackJobView(job.id, session.user.id, headersList)
    
    // Mark JobMatch as viewed if it exists
    if (session.user.candidateProfileId) {
      await db.jobMatch.updateMany({
        where: {
          jobId: job.id,
          candidateId: session.user.candidateProfileId,
        },
        data: {
          viewed: true,
        },
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      
      <main className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Jobs', href: '/dashboard/jobs' },
                { label: job.title },
              ]}
            />
            
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              {/* Header with status and actions */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-neutral-900 mb-2">{job.title}</h1>
                  <p className="text-lg text-neutral-600 mb-2">
                    {job.employer.orgName} • {job.level}
                  </p>
                  {/* Payment Status Badge for Employers */}
                  {isJobOwner && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        job.status === 'LIVE' ? 'bg-green-100 text-green-700' :
                        job.status === 'PENDING_ADMIN_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                        job.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                      {!hasPayment && job.status !== 'LIVE' && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-100 text-accent-600">
                          Payment Required
                        </span>
                      )}
                      {job._count.applications > 0 && (
                        <Link
                          href={`/dashboard/applications?jobId=${job.id}`}
                          className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200"
                        >
                          {job._count.applications} Application{job._count.applications !== 1 ? 's' : ''}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Employer Actions */}
                {isJobOwner && (
                  <div className="flex flex-col gap-2 ml-4">
                    {!hasPayment && job.status !== 'LIVE' && (
                      <Link
                        href={`/dashboard/jobs/${job.id}/payment`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm text-center"
                      >
                        Pay to Publish
                      </Link>
                    )}
                    {job._count.applications > 0 && (
                      <Link
                        href={`/dashboard/applications?jobId=${job.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm text-center"
                      >
                        View Applications ({job._count.applications})
                      </Link>
                    )}
                  </div>
                )}
              </div>
              {job.location && (
                <p className="text-neutral-600 mb-4">
                  📍 {job.location}
                  {job.remoteAllowed && ' • Remote Available'}
                </p>
              )}
              {job.compensationMin && job.compensationMax && (
                <p className="text-xl font-semibold text-primary-700 mb-6">
                  ${job.compensationMin.toLocaleString()} - ${job.compensationMax.toLocaleString()}
                </p>
              )}
              <div className="prose max-w-none mb-6">
                <div dangerouslySetInnerHTML={{ __html: job.descriptionRich }} />
              </div>
              {session.user.role === 'CANDIDATE' && (
                <div className="mt-6 flex gap-4">
                  {hasApplied ? (
                    <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-lg">
                      You have already applied for this position.
                    </div>
                  ) : (
                    <JobApplyButton jobId={job.id} />
                  )}
                  <JobSaveButton jobId={job.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
