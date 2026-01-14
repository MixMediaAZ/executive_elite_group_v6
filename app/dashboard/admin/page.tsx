import { redirect } from 'next/navigation'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import DrawerNavigation from '@/components/drawer-navigation'
import { db } from '@/lib/db'
import { jobSeedTemplates } from '@/lib/job-seed-templates'
import AdminJobSeeder from './components/admin-job-seeder'
import AdminUserManager from './components/admin-user-manager'

export default async function AdminConsolePage() {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [employers, tiers, users, auditLogs] = await Promise.all([
    db.employerProfile.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, status: true },
        },
      },
    }),
    db.tier.findMany({
      orderBy: { priceCents: 'asc' },
    }),
    db.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    db.auditLog.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { email: true },
        },
      },
    }),
  ])

  const templates = jobSeedTemplates.map((template) => ({
    key: template.key,
    label: template.label,
  }))

  const employerOptions = employers.map((employer: { id: string; orgName: string | null; adminApproved: boolean; user: { email: string } }) => ({
    id: employer.id,
    organizationName: employer.orgName || 'Unnamed Organization',
    approved: employer.adminApproved,
    userEmail: employer.user.email,
  }))

  const tierOptions = tiers.map((tier: { id: string; name: string; priceCents: number; durationDays: number }) => ({
    id: tier.id,
    name: tier.name,
    priceCents: tier.priceCents,
    durationDays: tier.durationDays,
  }))

  const userRows = users.map((user: { id: string; email: string; role: string; status: string; createdAt: Date }) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DrawerNavigation userRole={session.user.role} userEmail={session.user.email} />

      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-8">
            <div>
              <h1 className="text-4xl font-serif text-eeg-charcoal">Admin Console</h1>
              <p className="mt-2 text-gray-600">
                Seed premium jobs, maintain user access, and review compliance activity.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <AdminJobSeeder
                templates={templates}
                employers={employerOptions}
                tiers={tierOptions}
              />

              <AdminUserManager users={userRows} currentAdminId={session.user.id} />

              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Audit Trail</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Every administrative action is recorded for traceability and compliance.
                </p>
                <div className="space-y-3">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log: { id: string; actionType: string; targetType: string | null; targetId: string | null; detailsJson: string | null; createdAt: Date; actor: { email: string } | null }) => (
                      <div key={log.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {log.actionType} • {log.targetType ?? 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.actor?.email ?? 'Unknown admin'} •{' '}
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-gray-400">{log.id}</span>
                        </div>
                        {log.detailsJson != null && (
                          <pre className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded p-2 text-gray-700 overflow-auto">
                            {log.detailsJson}
                          </pre>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No recent admin activity.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

