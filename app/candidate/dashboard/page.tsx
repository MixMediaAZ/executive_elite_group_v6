import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCandidateJobMatches } from '@/lib/matching'
import Link from 'next/link'

export default async function CandidateDashboardPage() {
  const session = await getServerSessionHelper()

  if (!session || session.user.role !== 'CANDIDATE') {
    redirect('/auth/login')
  }

  if (!session.user.candidateProfileId) {
    redirect('/candidate/onboarding')
  }

  // Get candidate profile
  const candidate = await db.candidateProfile.findUnique({
    where: { id: session.user.candidateProfileId },
  })

  if (!candidate) {
    redirect('/candidate/onboarding')
  }

  // Get job matches
  const matches = await getCandidateJobMatches(session.user.candidateProfileId)

  // Get applications
  const applications = await db.application.findMany({
    where: { candidateId: session.user.candidateProfileId },
    include: {
      job: {
        include: {
          employer: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Next Move Navigator logic
  const targetLevels = candidate.targetLevelsJson 
    ? JSON.parse(candidate.targetLevelsJson) 
    : []
  const primaryServiceLines = candidate.primaryServiceLinesJson
    ? JSON.parse(candidate.primaryServiceLinesJson)
    : []
  
  const nextMoves = generateNextMoves(candidate, targetLevels, primaryServiceLines)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6 sm:mb-8">Candidate Dashboard</h1>

        {/* Suggested Roles */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Suggested Roles for You</h2>
          {matches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <p className="text-gray-600 text-center">No job matches found. Complete your profile to get better suggestions.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <div key={match.job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <h3 className="text-lg sm:text-xl font-serif text-eeg-charcoal">{match.job.title}</h3>
                    <span className="text-sm font-semibold text-eeg-blue-600 bg-eeg-blue-50 px-3 py-1 rounded-full inline-block sm:inline">
                      {Math.round(match.score)}% match
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">{match.job.employer.orgName}</p>
                  <p className="text-sm text-gray-500 mb-4">{match.job.location}</p>
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-eeg-blue-500 rounded-r-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">{match.explanation}</p>
                  </div>
                  <Link
                    href={`/jobs/${match.job.id}`}
                    className="inline-block w-full sm:w-auto text-center px-4 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Your Applications */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Your Applications</h2>
          {applications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <p className="text-gray-600 text-center">You haven&apos;t applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Employer</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app: any) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <Link href={`/jobs/${app.job.id}`} className="text-eeg-blue-600 hover:text-eeg-blue-700 font-medium hover:underline">
                            {app.job.title}
                          </Link>
                          <p className="text-sm text-gray-500 sm:hidden mt-1">{app.job.employer.orgName}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{app.job.employer.orgName}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            app.status === 'OFFER' ? 'bg-green-100 text-green-800' :
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            app.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Next Move Navigator */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-4 sm:mb-6">Next Move Navigator</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {nextMoves.length === 0 ? (
              <p className="text-gray-600 text-center">Complete your profile to see career path suggestions.</p>
            ) : (
              <div className="space-y-5">
                {nextMoves.map((move, idx) => (
                  <div key={idx} className="border-l-4 border-eeg-blue-500 pl-4 sm:pl-6 py-2">
                    <h3 className="text-lg sm:text-xl font-serif text-eeg-charcoal mb-3">{move.title}</h3>
                    {move.skillsGaps.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Skills gaps to reach this role:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                          {move.skillsGaps.map((gap, i) => (
                            <li key={i}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Link
                      href={`/jobs?level=${move.level}&serviceLine=${encodeURIComponent(move.serviceLine || '')}`}
                      className="inline-flex items-center text-sm font-semibold text-eeg-blue-600 hover:text-eeg-blue-700 transition-colors"
                    >
                      View matching jobs →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function generateNextMoves(candidate: any, targetLevels: string[], primaryServiceLines: string[]) {
  const moves: Array<{
    title: string
    level: string
    serviceLine?: string
    skillsGaps: string[]
  }> = []

  // Generate next moves based on target levels and service lines
  if (targetLevels.length > 0) {
    const highestTarget = targetLevels[0] // Assuming sorted
    const serviceLine = primaryServiceLines[0] || 'healthcare'

    moves.push({
      title: `${highestTarget.replace(/_/g, ' ')} at ${serviceLine} organization`,
      level: highestTarget,
      serviceLine,
      skillsGaps: generateSkillsGaps(candidate, highestTarget),
    })
  }

  // Add a generic next move if no specific targets
  if (moves.length === 0) {
    moves.push({
      title: 'VP or Director role in healthcare leadership',
      level: 'VP',
      skillsGaps: ['Multi-site P&L >$500M', 'Regulatory compliance expertise'],
    })
  }

  return moves
}

function generateSkillsGaps(candidate: any, targetLevel: string): string[] {
  const gaps: string[] = []

  if (targetLevel === 'C_SUITE' || targetLevel === 'VP') {
    if (!candidate.budgetManagedMin || candidate.budgetManagedMin < 500000000) {
      gaps.push('Multi-site P&L >$500M')
    }
    gaps.push('Board-level presentation experience')
  }

  if (targetLevel === 'DIRECTOR' || targetLevel === 'VP') {
    gaps.push('Cross-functional team leadership')
  }

  return gaps
}

