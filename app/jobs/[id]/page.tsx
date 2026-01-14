import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { trackJobView } from '@/lib/job-tracking'
import JobApplyButton from '@/components/job-apply-button'
import JobSaveButton from '@/components/job-save-button'
import Breadcrumb from '@/components/breadcrumb'
import { headers } from 'next/headers'

export default async function PublicJobDetail({ params }: { params: { id: string } }) {
  const session = await getServerSessionHelper()
  const headersList = await headers()

  const job = await db.job.findUnique({
    where: { id: params.id },
    include: {
      employer: {
        select: {
          orgName: true,
          about: true,
          website: true,
          orgType: true,
        },
      },
      tier: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!job || job.status !== 'LIVE') {
    notFound()
  }

  // Track job view
  await trackJobView(
    job.id,
    session?.user.id,
    headersList
  )

  const isCandidate = session?.user.role === 'CANDIDATE'
  let hasApplied = false

  if (isCandidate && session?.user.candidateProfileId) {
    const application = await db.application.findFirst({
      where: {
        jobId: job.id,
        candidateId: session.user.candidateProfileId,
      },
      select: { id: true },
    })
    hasApplied = !!application
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Jobs', href: '/jobs' },
            { label: job.title },
          ]}
        />

        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-serif text-eeg-charcoal mb-2">{job.title}</h1>
              <p className="text-lg text-gray-600 mb-4">
                {job.employer.orgName} • {job.level.replace(/_/g, ' ')}
              </p>
              {job.location && (
                <p className="text-gray-600 mb-4">
                  📍 {job.location}
                  {job.remoteAllowed && ' • Remote Available'}
                </p>
              )}
              {job.compensationMin && job.compensationMax && (
                <p className="text-xl font-semibold text-eeg-blue-electric mb-6">
                  ${job.compensationMin.toLocaleString()} - ${job.compensationMax.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {isCandidate ? (
                <div className="flex gap-3">
                  {hasApplied ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                      You have already applied for this position.
                    </div>
                  ) : (
                    <JobApplyButton jobId={job.id} />
                  )}
                  <JobSaveButton jobId={job.id} />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                >
                  Sign in to Apply
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 my-6" />

          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: job.descriptionRich }} />
          </div>

          <div className="mt-8 grid gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Employer</h3>
              <p className="text-lg text-eeg-charcoal">{job.employer.orgName}</p>
            </div>
            {job.employer.website && (
              <div>
                <h3 className="text-sm font-medium text-gray-600">Website</h3>
                <a
                  href={job.employer.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-eeg-blue-electric hover:text-eeg-blue-600"
                >
                  {job.employer.website}
                </a>
              </div>
            )}
            {job.employer.about && (
              <div>
                <h3 className="text-sm font-medium text-gray-600">About the Organization</h3>
                <p className="text-gray-700">{job.employer.about}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

