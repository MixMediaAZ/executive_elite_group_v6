import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import JobApplyButton from '@/components/job-apply-button'
import JobSaveButton from '@/components/job-save-button'
import type { Prisma } from '@prisma/client'

type JobWithEmployer = Prisma.JobGetPayload<{
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
  }
}>

interface JobsPageProps {
  searchParams: {
    search?: string
    level?: string
    orgType?: string
    location?: string
    remote?: string
    salaryMin?: string
    salaryMax?: string
    department?: string
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const session = await getServerSessionHelper()
  const { level, orgType, location, remote, salaryMin, salaryMax, department, search } = searchParams

  const whereClause: Prisma.JobWhereInput = {
    status: 'LIVE',
  }

  // Add search query if provided
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { descriptionRich: { contains: search } },
      { employer: { orgName: { contains: search } } },
    ]
  }

  if (level) {
    whereClause.level = level
  }

  if (orgType) {
    whereClause.employer = {
      orgType: orgType,
    }
  }

  if (location) {
    whereClause.location = { contains: location }
  }

  if (remote === 'remote') {
    whereClause.remoteAllowed = true
  } else if (remote === 'onsite') {
    whereClause.remoteAllowed = false
  }

  if (salaryMin) {
    const minValue = parseInt(salaryMin, 10)
    if (!isNaN(minValue)) {
      whereClause.compensationMin = { gte: minValue }
    }
  }

  if (salaryMax) {
    const maxValue = parseInt(salaryMax, 10)
    if (!isNaN(maxValue)) {
      whereClause.compensationMax = { lte: maxValue }
    }
  }

  const jobs = await db.job.findMany({
    where: whereClause,
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Track search analytics
  if (search || level || orgType || location || remote || salaryMin || salaryMax) {
    const { trackSearch } = await import('@/lib/search-analytics')
    await trackSearch(
      search || '',
      {
        level: level as string,
        orgType: orgType as string,
        location: location as string,
        remote: remote as string,
        salaryMin: salaryMin as string,
        salaryMax: salaryMax as string,
      },
      jobs.length,
      session?.user.id
    )
  }

  return (
    <div 
      className="min-h-screen bg-neutral-50 relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}
    >
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <Image 
              src="/logo.jpg" 
              alt="Executive Elite Group" 
              width={200}
              height={80}
              className="h-20 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Executive Opportunities</h1>
          <p className="text-neutral-600">
            Browse live healthcare leadership roles across the Executive Elite Group network.
          </p>
        </div>

        {/* Filters */}
        <form className="bg-white rounded-lg border border-neutral-200 p-6 mb-10 grid gap-4 md:grid-cols-4 lg:grid-cols-7" method="GET">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Level</label>
            <select
              name="level"
              defaultValue={level || ''}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All Levels</option>
              <option value="C_SUITE">C-Suite</option>
              <option value="VP">VP</option>
              <option value="DIRECTOR">Director</option>
              <option value="MANAGER">Manager</option>
              <option value="OTHER_EXECUTIVE">Other Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Organization Type</label>
            <select
              name="orgType"
              defaultValue={orgType || ''}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All Types</option>
              <option value="HEALTH_SYSTEM">Health System</option>
              <option value="HOSPICE">Hospice</option>
              <option value="LTC">Long-Term Care</option>
              <option value="HOME_CARE">Home Care</option>
              <option value="POST_ACUTE">Post-Acute</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={location || ''}
              placeholder="City, State, Country"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Work Type</label>
            <select
              name="remote"
              defaultValue={remote || ''}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-Site</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Min Salary</label>
            <input
              type="number"
              name="salaryMin"
              defaultValue={salaryMin || ''}
              placeholder="Min"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Salary</label>
            <input
              type="number"
              name="salaryMax"
              defaultValue={salaryMax || ''}
              placeholder="Max"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-primary-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-primary-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center text-neutral-600">
              No jobs match your filters. Try adjusting the search criteria.
            </div>
          ) : (
            jobs.map((job: JobWithEmployer) => (
              <div key={job.id} className="group bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/jobs/${job.id}`} className="text-xl font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                      {job.title}
                    </Link>
                    <p className="text-sm text-neutral-600 mt-2">
                      {job.employer.orgName} • {job.level.replace(/_/g, ' ')}
                    </p>
                    {job.location && (
                      <p className="text-sm text-neutral-600">
                        📍 {job.location}
                        {job.remoteAllowed && ' • Remote'}
                      </p>
                    )}
                    {job.compensationMin && job.compensationMax && (
                      <p className="text-sm text-primary-700 font-semibold mt-2">
                        ${job.compensationMin.toLocaleString()} - ${job.compensationMax.toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-neutral-700 mt-3 line-clamp-2">
                      {job.descriptionRich.replace(/<[^>]*>/g, '').substring(0, 220)}...
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-6 py-3 border-2 border-neutral-300 rounded-lg font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-700"
                    >
                      View Details
                    </Link>
                    {session?.user.role === 'CANDIDATE' ? (
                      <div className="flex gap-2">
                        <JobApplyButton jobId={job.id} />
                        <JobSaveButton jobId={job.id} />
                      </div>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="text-sm text-neutral-600 text-center hover:text-primary-700"
                      >
                        Sign in to apply
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

