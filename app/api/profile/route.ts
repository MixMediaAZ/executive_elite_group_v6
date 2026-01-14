import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { candidateProfileUpdateSchema, employerProfileUpdateSchema } from '@/lib/validation-schemas'
import { sanitizePlainText } from '@/lib/security/sanitize'

export const PUT = withApiHandler(
  async (request: NextRequest, { session }) => {
    const body = await request.json()

    if (session.user.role === 'CANDIDATE') {
      if (!session.user.candidateProfileId) return errorResponse('Profile not found', 404)

      const validated = validateBody(candidateProfileUpdateSchema, body)
      const updateData: Record<string, unknown> = {}

      // Map new schema fields (sanitize strings)
      if (validated.fullName !== undefined) updateData.fullName = sanitizePlainText(validated.fullName, { maxLen: 120 })
      if (validated.currentTitle !== undefined) updateData.currentTitle = validated.currentTitle ? sanitizePlainText(validated.currentTitle, { maxLen: 120 }) : null
      if (validated.currentOrg !== undefined) updateData.currentOrg = validated.currentOrg ? sanitizePlainText(validated.currentOrg, { maxLen: 120 }) : null
      if (validated.primaryLocation !== undefined) updateData.primaryLocation = validated.primaryLocation ? sanitizePlainText(validated.primaryLocation, { maxLen: 120 }) : null
      if (validated.willingToRelocate !== undefined) updateData.willingToRelocate = validated.willingToRelocate
      if (validated.relocationRegionsJson !== undefined) updateData.relocationRegionsJson = sanitizePlainText(validated.relocationRegionsJson, { maxLen: 20_000 })
      if (validated.preferredSettingsJson !== undefined) updateData.preferredSettingsJson = sanitizePlainText(validated.preferredSettingsJson, { maxLen: 20_000 })
      if (validated.preferredEmploymentType !== undefined) updateData.preferredEmploymentType = validated.preferredEmploymentType ? sanitizePlainText(validated.preferredEmploymentType, { maxLen: 120 }) : null
      if (validated.targetLevelsJson !== undefined) updateData.targetLevelsJson = sanitizePlainText(validated.targetLevelsJson, { maxLen: 10_000 })
      if (validated.budgetManagedMin !== undefined) updateData.budgetManagedMin = validated.budgetManagedMin
      if (validated.budgetManagedMax !== undefined) updateData.budgetManagedMax = validated.budgetManagedMax
      if (validated.teamSizeMin !== undefined) updateData.teamSizeMin = validated.teamSizeMin
      if (validated.teamSizeMax !== undefined) updateData.teamSizeMax = validated.teamSizeMax
      if (validated.primaryServiceLinesJson !== undefined) updateData.primaryServiceLinesJson = sanitizePlainText(validated.primaryServiceLinesJson, { maxLen: 20_000 })
      if (validated.ehrExperienceJson !== undefined) updateData.ehrExperienceJson = sanitizePlainText(validated.ehrExperienceJson, { maxLen: 20_000 })
      if (validated.regulatoryExperienceJson !== undefined) updateData.regulatoryExperienceJson = sanitizePlainText(validated.regulatoryExperienceJson, { maxLen: 20_000 })
      if (validated.summary !== undefined) updateData.summary = validated.summary ? sanitizePlainText(validated.summary, { maxLen: 20_000 }) : null

      // Legacy fields for backward compatibility
      if (validated.firstName !== undefined && validated.lastName !== undefined) {
        updateData.fullName = sanitizePlainText(`${validated.firstName} ${validated.lastName}`.trim(), { maxLen: 120 })
      }
      if (validated.locationCity !== undefined || validated.locationState !== undefined) {
        const locationParts = [validated.locationCity, validated.locationState].filter(Boolean).map((p) => sanitizePlainText(String(p), { maxLen: 60 }))
        if (locationParts.length > 0) updateData.primaryLocation = locationParts.join(', ')
      }

      await db.candidateProfile.update({
        where: { id: session.user.candidateProfileId },
        data: updateData,
      })

      return successResponse()
    }

    if (session.user.role === 'EMPLOYER') {
      if (!session.user.employerProfileId) return errorResponse('Profile not found', 404)

      const validated = validateBody(employerProfileUpdateSchema, body)
      const updateData: Record<string, unknown> = {}

      if (validated.orgName !== undefined) updateData.orgName = sanitizePlainText(validated.orgName, { maxLen: 200 })
      if (validated.orgType !== undefined) updateData.orgType = sanitizePlainText(validated.orgType, { maxLen: 80 })
      if (validated.hqLocation !== undefined) updateData.hqLocation = validated.hqLocation ? sanitizePlainText(validated.hqLocation, { maxLen: 200 }) : null
      if (validated.website !== undefined) updateData.website = validated.website ? sanitizePlainText(validated.website, { maxLen: 500 }) : null
      if (validated.about !== undefined) updateData.about = validated.about ? sanitizePlainText(validated.about, { maxLen: 20_000 }) : null

      // Legacy fields
      if (validated.organizationName !== undefined) updateData.orgName = sanitizePlainText(validated.organizationName, { maxLen: 200 })
      if (validated.websiteUrl !== undefined) updateData.website = validated.websiteUrl ? sanitizePlainText(validated.websiteUrl, { maxLen: 500 }) : null
      if (validated.description !== undefined) updateData.about = validated.description ? sanitizePlainText(validated.description, { maxLen: 20_000 }) : null
      if (validated.headquartersCity !== undefined || validated.headquartersState !== undefined) {
        const hqParts = [validated.headquartersCity, validated.headquartersState].filter(Boolean).map((p) => sanitizePlainText(String(p), { maxLen: 60 }))
        if (hqParts.length > 0) updateData.hqLocation = hqParts.join(', ')
      }

      await db.employerProfile.update({
        where: { id: session.user.employerProfileId },
        data: updateData,
      })

      return successResponse()
    }

    return errorResponse('Unsupported role', 400)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:profile', limit: 30, windowSeconds: 60 },
  }
)

