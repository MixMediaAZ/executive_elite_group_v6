import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import DrawerNavigation from '@/components/drawer-navigation'
import TopNavigation from '@/components/top-navigation'
import type { Prisma } from '@prisma/client'

type JobWithDetails = Prisma.JobGetPayload<{
  include: {
    employer: {
      select: {
        orgName: true
        orgType: true
      }
    }
    tier: {
      select: {
        name: true
      }
    }
    payments: {
      where: { status: 'paid' }
      take: 1
    }
    _count: {
      select: {
        applications: true
      }
    }
  }
}>

export default async function JobsPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  const jobs = await db.job.findMany({
    where: {
      status: 'LIVE',
    },
    include: {
      employer: {
        select: {
          orgName: true,
          orgType: true,
        },
      },
      tier: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div 
      className="min-h-screen bg-neutral-50 flex flex-col relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10 flex flex-col flex-1">
      <TopNavigation userRole={session.user.role} userEmail={session.user.email} />
      <div className="flex flex-1">
        <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
        
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-4xl font-bold text-neutral-900">Job Listings</h1>
              {session.user.role === 'EMPLOYER' && (
                <Link
                  href="/dashboard/jobs/new"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Post New Job
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center text-neutral-600">
                  No jobs available at this time.
                </div>
              ) : (
                jobs.map((job: JobWithDetails) => (
                  <div key={job.id} className="group bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors">{job.title}</h2>
                        <p className="text-sm text-neutral-600 mb-2">
                          {job.employer.orgName} • {job.level} • {job.location || 'Remote'}
                        </p>
                        <p className="text-sm text-neutral-700 mt-2 line-clamp-2">
                          {job.descriptionRich.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                        {job.compensationMin && job.compensationMax && (
                          <p className="text-sm text-primary-700 font-semibold mt-2">
                            ${job.compensationMin.toLocaleString()} - ${job.compensationMax.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {session.user.role === 'CANDIDATE' && (
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="px-6 py-3 border-2 border-neutral-300 rounded-lg font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-700"
                          >
                            View Details
                          </Link>
                        )}
                        {session.user.role === 'EMPLOYER' && job.employerId === session.user.employerProfileId && (
                          <div className="flex flex-col gap-2 items-end">
                            <div className="text-xs text-gray-500 mb-1">
                              Status: <span className={`font-semibold ${
                                job.status === 'LIVE' ? 'text-green-600' :
                                job.status === 'PENDING_ADMIN_REVIEW' ? 'text-yellow-600' :
                                job.status === 'DRAFT' ? 'text-gray-600' :
                                'text-red-600'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            {job.payments.length === 0 && job.status !== 'LIVE' && (
                              <Link
                                href={`/dashboard/jobs/${job.id}/payment`}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                              >
                                Pay to Publish
                              </Link>
                            )}
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                            >
                              Manage
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </main>
      </div>
      </div>
    </div>
  )
}
