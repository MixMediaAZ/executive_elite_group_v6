import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DrawerNavigation from '@/components/drawer-navigation'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'

type SavedJobWithJob = Prisma.SavedJobGetPayload<{
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

export default async function SavedJobsPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'CANDIDATE' || !session.user.candidateProfileId) {
    redirect('/dashboard')
  }

  const savedJobs = await db.savedJob.findMany({
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
    orderBy: { savedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      
      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-bold text-neutral-900 mb-6">Saved Jobs</h1>

            {savedJobs.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center text-neutral-600">
                No saved jobs yet.
              </div>
            ) : (
              <div className="space-y-4">
                {savedJobs.map((saved: SavedJobWithJob) => (
                  <div key={saved.id} className="group bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all duration-200">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors">{saved.job.title}</h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      {saved.job.employer.orgName} • {saved.job.level}
                    </p>
                    {saved.job.compensationMin && saved.job.compensationMax && (
                      <p className="text-sm text-primary-700 font-semibold mb-2">
                        ${saved.job.compensationMin.toLocaleString()} - ${saved.job.compensationMax.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600 mb-4">
                      Saved: {new Date(saved.savedAt).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/dashboard/jobs/${saved.job.id}`}
                      className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      View Details
                    </Link>
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

