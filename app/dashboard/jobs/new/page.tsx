import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DrawerNavigation from '@/components/drawer-navigation'
import JobPostForm from './job-post-form'

export default async function NewJobPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'EMPLOYER') {
    redirect('/dashboard')
  }

  // Check if employer is approved
  if (session.user.employerProfileId) {
    const employer = await db.employerProfile.findUnique({
      where: { id: session.user.employerProfileId },
      select: { adminApproved: true },
    })

    if (!employer?.adminApproved) {
      redirect('/dashboard')
    }
  }

  // Get default tier (first active tier)
  const defaultTier = await db.tier.findFirst({
    where: { active: true },
    orderBy: { priceCents: 'asc' },
  })

  if (!defaultTier) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
        <main className="flex-1 lg:ml-0">
          <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                No job posting tiers available. Please contact support.
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      
      <main className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-serif text-eeg-charcoal mb-6">Post New Job</h1>
            <JobPostForm defaultTierId={defaultTier.id} />
          </div>
        </div>
      </main>
    </div>
  )
}

