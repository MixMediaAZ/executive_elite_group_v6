import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import StatCard from '@/components/dashboard/stat-card'
import AdminSubNav from '@/components/dashboard/admin-sub-nav'

/**
 * Unified admin home. Single entry point that ties together the
 * previously fragmented `/admin/*` and `/dashboard/admin/*` routes.
 */
export default async function AdminHomePage() {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [
    totalCandidates,
    totalEmployers,
    liveJobs,
    totalApplications,
    pendingEmployers,
    pendingJobs,
  ] = await Promise.all([
    db.candidateProfile.count(),
    db.employerProfile.count(),
    db.job.count({ where: { status: 'LIVE' } }),
    db.application.count(),
    db.employerProfile.count({ where: { adminApproved: false } }),
    db.job.count({ where: { status: 'PENDING_ADMIN_REVIEW' } }),
  ])

  const pendingTotal = pendingEmployers + pendingJobs

  const quickActions = [
    {
      href: '/dashboard',
      title: 'Approvals',
      desc:
        pendingTotal > 0
          ? `${pendingEmployers} employer(s), ${pendingJobs} job(s) awaiting review`
          : 'All caught up — nothing pending',
    },
    { href: '/dashboard/admin', title: 'Admin Console', desc: 'Seed jobs, manage users, view the audit trail' },
    { href: '/dashboard/admin/analytics', title: 'Analytics', desc: 'Platform analytics dashboard' },
    { href: '/admin/traffic', title: 'Website Traffic', desc: 'Pageviews, visitors, top pages, referrers, jobs board activity' },
    { href: '/admin/tiers', title: 'Pricing & Tiers', desc: 'Configure job-posting prices and subscription plans (Stripe-wired)' },
    { href: '/admin/employers', title: 'Employers', desc: 'Review and manage employer accounts' },
    { href: '/admin/insights', title: 'Insights', desc: 'Platform metrics and audit logs' },
    { href: '/admin/health', title: 'System Health', desc: 'Service and database health checks' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6">
          Admin Home
        </h1>
        <AdminSubNav />

        {/* KPI row */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Candidates" value={totalCandidates} />
            <StatCard label="Employers" value={totalEmployers} />
            <StatCard label="Live Jobs" value={liveJobs} accent="green" />
            <StatCard label="Applications" value={totalApplications} accent="blue" />
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block bg-white rounded-2xl border border-neutral-200 p-6 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-eeg-blue-electric"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-eeg-charcoal">{action.title}</h3>
                  {action.href === '/dashboard' && pendingTotal > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      {pendingTotal}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 mt-1">{action.desc}</p>
                <span className="inline-block mt-3 text-sm font-medium text-eeg-blue-electric">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
