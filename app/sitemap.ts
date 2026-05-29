import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE_URL = 'https://www.executiveelitegroup.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all live job IDs and their last-updated timestamps
  const liveJobs = await db.job.findMany({
    where: { status: 'LIVE' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const jobEntries: MetadataRoute.Sitemap = liveJobs.map((job: { id: string; updatedAt: Date }) => ({
    url: `${BASE_URL}/jobs/${job.id}`,
    lastModified: job.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/trust`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...jobEntries,
  ]
}
