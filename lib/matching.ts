/**
 * Match Suggestion Algorithm
 * 
 * Computes job matches for candidates based on their profile.
 * Returns scores and human-readable explanations.
 */

import { db } from './db'

// Define types locally since Prisma uses String types instead of enums for SQLite compatibility
type JobLevel = 'C_SUITE' | 'VP' | 'DIRECTOR' | 'MANAGER' | 'OTHER_EXECUTIVE'

export interface JobMatch {
  job: {
    id: string
    title: string
    level: JobLevel
    location: string
    remoteAllowed: boolean
    employer: {
      orgName: string
    }
    compensationMin: number | null
    compensationMax: number | null
  }
  score: number
  explanation: string
}

/**
 * Get job matches for a candidate
 * Uses cached JobMatch records when available, otherwise computes and caches
 * 
 * @param candidateId - Candidate profile ID
 * @param forceRefresh - Force recomputation even if cache exists
 * @returns Array of job matches with scores and explanations
 */
export async function getCandidateJobMatches(
  candidateId: string,
  forceRefresh: boolean = false
): Promise<JobMatch[]> {
  const candidate = await db.candidateProfile.findUnique({
    where: { id: candidateId },
  })

  if (!candidate) {
    return []
  }

  // Check for cached matches (unless forcing refresh)
  if (!forceRefresh) {
    const cachedMatches = await db.jobMatch.findMany({
      where: {
        candidateId,
        viewed: false, // Only get unviewed matches
      },
      include: {
        job: {
          include: {
            employer: true,
          },
        },
      },
      orderBy: {
        matchScore: 'desc',
      },
      take: 20, // Limit to top 20 matches
    })

    // If we have recent cached matches (less than 24 hours old), use them
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentMatches = cachedMatches.filter((m: any) => m.updatedAt > oneDayAgo)

    if (recentMatches.length > 0) {
      return recentMatches.map((m: any) => ({
        job: {
          id: m.job.id,
          title: m.job.title,
          level: m.job.level as any,
          location: m.job.location,
          remoteAllowed: m.job.remoteAllowed,
          employer: {
            orgName: m.job.employer.orgName,
          },
          compensationMin: m.job.compensationMin,
          compensationMax: m.job.compensationMax,
        },
        score: m.matchScore,
        explanation: m.matchReasonsJson 
          ? JSON.parse(m.matchReasonsJson).join(', ') 
          : 'This role may be a good fit based on your profile.',
      }))
    }
  }

  // Compute matches (cache miss or force refresh)
  const jobs = await db.job.findMany({
    where: { status: 'LIVE' },
    include: {
      employer: true,
    },
  })

  const matches: JobMatch[] = []
  const matchReasons: Record<string, string[]> = {}

  for (const job of jobs) {
    const match = computeMatch(candidate, job)
    if (match.score > 0) {
      matches.push(match)
      // Extract reasons from explanation for caching
      const reasons = match.explanation
        .replace('We suggested this role because: ', '')
        .replace(' fit the hiring team\'s criteria.', '')
        .split(', ')
        .filter(r => r.length > 0)
      matchReasons[job.id] = reasons
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Cache matches in database (upsert to avoid duplicates)
  if (matches.length > 0) {
    await Promise.all(
      matches.map(match =>
        db.jobMatch.upsert({
          where: {
            jobId_candidateId: {
              jobId: match.job.id,
              candidateId,
            },
          },
          create: {
            jobId: match.job.id,
            candidateId,
            matchScore: match.score,
            matchReasonsJson: JSON.stringify(matchReasons[match.job.id] || []),
            aiGenerated: true,
          },
          update: {
            matchScore: match.score,
            matchReasonsJson: JSON.stringify(matchReasons[match.job.id] || []),
            updatedAt: new Date(),
          },
        })
      )
    )

    // Log match suggestions to audit log
    await db.auditLog.create({
      data: {
        actorUserId: candidate.userId,
        actionType: 'match_suggestion',
        targetType: 'CandidateProfile',
        targetId: candidateId,
        detailsJson: JSON.stringify({
          candidateId,
          jobIds: matches.map(m => m.job.id),
          scores: matches.map(m => ({ jobId: m.job.id, score: m.score })),
          cached: !forceRefresh,
        }),
      },
    })
  }

  return matches
}

function computeMatch(candidate: any, job: any): JobMatch {
  let score = 0
  const reasons: string[] = []

  // Level alignment (40 points max)
  const candidateLevels = candidate.targetLevelsJson 
    ? JSON.parse(candidate.targetLevelsJson) 
    : []
  
  if (candidateLevels.includes(job.level)) {
    score += 40
    reasons.push(`target level (${job.level.replace('_', ' ')})`)
  } else {
    // Partial match for similar levels
    const levelHierarchy: Record<string, number> = {
      'C_SUITE': 5,
      'VP': 4,
      'DIRECTOR': 3,
      'MANAGER': 2,
      'OTHER_EXECUTIVE': 1,
    }
    const candidateMaxLevel = Math.max(...candidateLevels.map((l: string) => levelHierarchy[l] || 0))
    const jobLevel = levelHierarchy[job.level] || 0
    if (jobLevel <= candidateMaxLevel + 1) {
      score += 20
      reasons.push(`similar level (${job.level.replace('_', ' ')})`)
    }
  }

  // Service line overlap (30 points max)
  const candidateServiceLines = candidate.primaryServiceLinesJson
    ? JSON.parse(candidate.primaryServiceLinesJson)
    : []
  
  const jobServiceLines = job.requiredSettingExperienceJson
    ? JSON.parse(job.requiredSettingExperienceJson)
    : []
  
  if (candidateServiceLines.length > 0 && jobServiceLines.length > 0) {
    const overlap = candidateServiceLines.filter((s: string) => 
      jobServiceLines.some((js: string) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
    )
    if (overlap.length > 0) {
      score += 30
      reasons.push(`service line experience (${overlap.join(', ')})`)
    }
  }

  // Setting overlap (20 points max)
  const candidateSettings = candidate.preferredSettingsJson
    ? JSON.parse(candidate.preferredSettingsJson)
    : []
  
  // Try to infer setting from job description or org type
  const jobSetting = inferJobSetting(job)
  if (jobSetting && candidateSettings.some((s: string) => s.toLowerCase().includes(jobSetting.toLowerCase()))) {
    score += 20
    reasons.push(`preferred setting (${jobSetting})`)
  }

  // Location / relocation (10 points max)
  if (candidate.primaryLocation && job.location) {
    if (candidate.primaryLocation.toLowerCase().includes(job.location.toLowerCase()) ||
        job.location.toLowerCase().includes(candidate.primaryLocation.toLowerCase())) {
      score += 10
      reasons.push('location match')
    } else if (candidate.willingToRelocate) {
      score += 5
      reasons.push('willing to relocate')
    }
  } else if (job.remoteAllowed) {
    score += 10
    reasons.push('remote opportunity')
  }

  // Budget/compensation alignment (bonus points)
  if (candidate.budgetManagedMin && job.compensationMin) {
    if (job.compensationMin >= candidate.budgetManagedMin * 0.8) {
      score += 5
      reasons.push('compensation alignment')
    }
  }

  // Generate explanation
  let explanation = 'We suggested this role because: '
  if (reasons.length > 0) {
    explanation += reasons.join(', ') + ' fit the hiring team\'s criteria.'
  } else {
    explanation = 'This role may be a good fit based on your profile.'
  }

  return {
    job: {
      id: job.id,
      title: job.title,
      level: job.level,
      location: job.location,
      remoteAllowed: job.remoteAllowed,
      employer: {
        orgName: job.employer.orgName,
      },
      compensationMin: job.compensationMin,
      compensationMax: job.compensationMax,
    },
    score,
    explanation,
  }
}

function inferJobSetting(job: any): string | null {
  // Try to infer from org type or job description
  const orgType = job.employer?.orgType || ''
  const settingMap: Record<string, string> = {
    'HEALTH_SYSTEM': 'Health System',
    'HOSPICE': 'Hospice',
    'LTC': 'LTC',
    'HOME_CARE': 'Home Care',
    'POST_ACUTE': 'Post-Acute',
  }
  return settingMap[orgType] || null
}

