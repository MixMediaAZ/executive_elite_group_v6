import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminInsightsPage() {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  // Get aggregated metrics
  const [candidates, employers, jobs, applications, auditLogs] = await Promise.all([
    db.candidateProfile.count(),
    db.employerProfile.count(),
    db.job.count(),
    db.application.count(),
    db.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            email: true,
          },
        },
      },
    }),
  ])

  const approvedEmployers = await db.employerProfile.count({
    where: { adminApproved: true },
  })

  const pendingEmployers = employers - approvedEmployers

  const liveJobs = await db.job.count({
    where: { status: 'LIVE' },
  })

  const avgApplicationsPerJob = liveJobs > 0 ? (applications / liveJobs).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6 sm:mb-8">Admin Insights & Analytics</h1>

        {/* Metrics */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Platform Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Candidates</h3>
              <p className="text-3xl sm:text-4xl font-serif text-eeg-charcoal">{candidates}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Employers</h3>
              <p className="text-3xl sm:text-4xl font-serif text-eeg-charcoal">{employers}</p>
              <p className="text-sm text-gray-600 mt-2">
                {approvedEmployers} approved, {pendingEmployers} pending
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Live Jobs</h3>
              <p className="text-3xl sm:text-4xl font-serif text-eeg-charcoal">{liveJobs}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Applications</h3>
              <p className="text-3xl sm:text-4xl font-serif text-eeg-charcoal">{applications}</p>
              <p className="text-sm text-gray-600 mt-2">
                Avg: {avgApplicationsPerJob} per live job
              </p>
            </div>
          </div>
        </section>

        {/* Audit Logs */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Recent Audit Logs (Last 50)</h2>
          {auditLogs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <p className="text-gray-600 text-center">No audit logs yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Actor</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Target Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Target ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(log.createdAt).toLocaleDateString()}
                          <span className="hidden sm:inline ml-2 text-gray-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-eeg-blue-100 text-eeg-blue-800">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {log.actor?.email || log.actorUserId || 'System'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {log.targetType || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs hidden lg:table-cell">
                          {log.targetId ? log.targetId.substring(0, 8) + '...' : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href="/admin/employers"
            className="text-blue-600 hover:underline"
          >
            ← Back to Employer Management
          </Link>
        </div>
      </div>
    </div>
  )
}

