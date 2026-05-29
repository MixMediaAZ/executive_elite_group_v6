import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import ApprovalButtons from '@/components/admin-approval-buttons'
import AdminSubNav from '@/components/dashboard/admin-sub-nav'
import Pagination from '@/components/dashboard/pagination'

const EMPLOYER_PAGE_SIZE = 25

export default async function AdminEmployersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)
  const skip = (currentPage - 1) * EMPLOYER_PAGE_SIZE

  const employerInclude = {
    user: {
      select: { email: true, status: true },
    },
    approvedByAdmin: {
      select: { email: true },
    },
  }

  // Pending employers are shown in full (the queue should stay small);
  // approved employers are paginated.
  const [pendingEmployers, approvedEmployers, approvedCount] = await Promise.all([
    db.employerProfile.findMany({
      where: { adminApproved: false },
      orderBy: { createdAt: 'desc' },
      include: employerInclude,
    }),
    db.employerProfile.findMany({
      where: { adminApproved: true },
      orderBy: { createdAt: 'desc' },
      include: employerInclude,
      take: EMPLOYER_PAGE_SIZE,
      skip,
    }),
    db.employerProfile.count({ where: { adminApproved: true } }),
  ])

  const approvedTotalPages = Math.ceil(approvedCount / EMPLOYER_PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6">Employer Management</h1>
        <AdminSubNav />

        {/* Pending Approvals */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Pending Approvals</h2>
          {pendingEmployers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <p className="text-gray-600 text-center">No pending employer approvals.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organization</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingEmployers.map((employer: any) => (
                      <tr key={employer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-gray-900">{employer.orgName}</div>
                          {employer.hqLocation && (
                            <div className="text-sm text-gray-500">{employer.hqLocation}</div>
                          )}
                          <div className="text-sm text-gray-500 sm:hidden mt-1">{employer.user.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {employer.user.email}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {employer.orgType.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {new Date(employer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <ApprovalButtons type="employer" id={employer.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Approved Employers */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">
            Approved Employers <span className="text-sm font-sans text-gray-500">({approvedCount} total)</span>
          </h2>
          {approvedEmployers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <p className="text-gray-600 text-center">No approved employers yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organization</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Approved By</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Approved Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvedEmployers.map((employer: any) => (
                      <tr key={employer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium text-gray-900">{employer.orgName}</div>
                          {employer.hqLocation && (
                            <div className="text-sm text-gray-500">{employer.hqLocation}</div>
                          )}
                          <div className="text-sm text-gray-500 sm:hidden mt-1">{employer.user.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {employer.user.email}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {employer.orgType.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                          {employer.approvedByAdmin?.email || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {employer.approvedByAdminId ? new Date(employer.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={approvedTotalPages}
            baseHref="/admin/employers"
          />
        </section>
      </div>
    </div>
  )
}

