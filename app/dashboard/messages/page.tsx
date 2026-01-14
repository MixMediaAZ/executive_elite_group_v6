import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import DrawerNavigation from '@/components/drawer-navigation'
import MessagesList from './messages-list'

export default async function MessagesPage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />

      <main className="flex-1 lg:ml-0">
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-4xl font-serif text-eeg-charcoal">Messages</h1>
              <p className="mt-2 text-gray-600">Communicate with candidates and employers</p>
            </div>

            <MessagesList />
          </div>
        </div>
      </main>
    </div>
  )
}

