import { redirect } from 'next/navigation'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import AdminHealthClient from './health-client'

export default async function AdminHealthPage() {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Server-gate access, then fetch health data client-side to avoid any build-time fetches.
  return <AdminHealthClient />
}

