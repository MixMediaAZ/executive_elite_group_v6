import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import DrawerNavigation from '@/components/drawer-navigation'
import AnalyticsDashboard from './analytics-dashboard'

export default async function AnalyticsPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-serif text-eeg-charcoal mb-6">Analytics Dashboard</h1>
            <AnalyticsDashboard />
          </div>
        </div>
      </main>
    </div>
  )
}

