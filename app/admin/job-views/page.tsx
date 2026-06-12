import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import TopNavigation from '@/components/top-navigation'
import AdminSubNav from '@/components/dashboard/admin-sub-nav'
import JobViewsClient from './job-views-client'

export const dynamic = 'force-dynamic'

export default async function AdminJobViewsPage() {
  const session = await getServerSessionHelper()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole={session.user.role} userEmail={session.user.email} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6">
          Job Views
        </h1>
        <AdminSubNav />
        <JobViewsClient />
      </div>
    </div>
  )
}
