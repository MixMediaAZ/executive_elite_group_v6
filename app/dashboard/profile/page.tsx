import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import ProfileForm from './profile-form'
import DrawerNavigation from '@/components/drawer-navigation'

export default async function ProfilePage() {
  const session = await getServerSessionHelper()

  if (!session) {
    redirect('/auth/login')
  }

  let profile = null

  if (session.user.role === 'CANDIDATE' && session.user.candidateProfileId) {
    profile = await db.candidateProfile.findUnique({
      where: { id: session.user.candidateProfileId },
    })
  } else if (session.user.role === 'EMPLOYER' && session.user.employerProfileId) {
    profile = await db.employerProfile.findUnique({
      where: { id: session.user.employerProfileId },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />
      
      <main className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-serif text-eeg-charcoal mb-6">Edit Profile</h1>
            <ProfileForm role={session.user.role} profile={profile} />
          </div>
        </div>
      </main>
    </div>
  )
}
