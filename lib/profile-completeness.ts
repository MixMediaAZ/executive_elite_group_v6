import type { CandidateProfile } from '@prisma/client'

/**
 * Profile completeness scoring.
 *
 * Computed at request time from existing CandidateProfile columns — no
 * schema change required. Returns an overall 0–100 score plus the single
 * highest-impact missing item so the dashboard can suggest a next step.
 */

interface CompletenessItem {
  key: string
  /** Suggested action shown when this item is missing */
  label: string
  /** Weight toward the 100-point total */
  weight: number
  filled: boolean
}

export interface ProfileCompleteness {
  /** 0–100 integer */
  score: number
  /** Highest-weight missing item, or null when the profile is complete */
  nextStep: { label: string; weight: number } | null
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function computeProfileCompleteness(
  profile: CandidateProfile | null,
  resumeCount: number,
): ProfileCompleteness {
  if (!profile) {
    return { score: 0, nextStep: { label: 'Create your candidate profile', weight: 100 } }
  }

  const items: CompletenessItem[] = [
    { key: 'summary', label: 'Add a professional summary', weight: 20, filled: hasText(profile.summary) },
    { key: 'resume', label: 'Upload a resume', weight: 15, filled: resumeCount > 0 },
    { key: 'narrative', label: 'Add narrative achievements', weight: 12, filled: hasText(profile.narrativeAchievements) },
    { key: 'currentTitle', label: 'Add your current title', weight: 10, filled: hasText(profile.currentTitle) },
    { key: 'location', label: 'Add your location', weight: 10, filled: hasText(profile.primaryLocation) },
    { key: 'yearsExperience', label: 'Add your years of experience', weight: 10, filled: profile.yearsExperience != null },
    { key: 'currentOrg', label: 'Add your current organization', weight: 8, filled: hasText(profile.currentOrg) },
    { key: 'phone', label: 'Add a phone number', weight: 5, filled: hasText(profile.phone) },
    { key: 'leadershipMetrics', label: 'Add leadership metrics', weight: 5, filled: hasText(profile.leadershipMetrics) },
    { key: 'videoIntro', label: 'Add a video introduction', weight: 5, filled: hasText(profile.videoIntroUrl) },
  ]

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  const earned = items.reduce((sum, i) => sum + (i.filled ? i.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)

  const missing = items
    .filter((i) => !i.filled)
    .sort((a, b) => b.weight - a.weight)

  return {
    score,
    nextStep: missing.length > 0 ? { label: missing[0].label, weight: missing[0].weight } : null,
  }
}
