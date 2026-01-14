/**
 * User Helper Utilities
 * Provides consistent user data access patterns
 */

import { db } from './db'

/**
 * Get display name for a user
 * Returns fullName for candidates, orgName for employers, or email as fallback
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      candidateProfile: {
        select: { fullName: true },
      },
      employerProfile: {
        select: { orgName: true },
      },
    },
  })

  if (!user) {
    return 'Unknown User'
  }

  if (user.candidateProfile?.fullName) {
    return user.candidateProfile.fullName
  }

  if (user.employerProfile?.orgName) {
    return user.employerProfile.orgName
  }

  return user.email
}

/**
 * Get display name from user object with profiles
 * Useful when you already have the user data loaded
 */
export function getUserDisplayNameFromObject(user: {
  email: string
  candidateProfile?: { fullName: string | null } | null
  employerProfile?: { orgName: string | null } | null
}): string {
  if (user.candidateProfile?.fullName) {
    return user.candidateProfile.fullName
  }

  if (user.employerProfile?.orgName) {
    return user.employerProfile.orgName
  }

  return user.email
}

