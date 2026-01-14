import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withApiHandler, validateBody, createdResponse, errorResponse } from '@/lib/api-helpers'
import { jobCreateSchema } from '@/lib/validation-schemas'
import { sanitizePlainText } from '@/lib/security/sanitize'

export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    // Auth, role, and profile checks are handled by withApiHandler

    // Check if employer is approved
    const employer = await db.employerProfile.findUnique({
      where: { id: session.user.employerProfileId },
      select: { adminApproved: true },
    })

    if (!employer?.adminApproved) {
      return errorResponse('Employer account must be approved to post jobs', 403)
    }

    const body = await request.json()
    const validated = validateBody(jobCreateSchema, body)

    // Verify tier exists
    const tier = await db.tier.findUnique({
      where: { id: validated.tierId },
    })

    if (!tier) {
      return errorResponse('Invalid tier', 400)
    }

    // Build location string from new or legacy fields
    let location = validated.location
    if (!location && (validated.locationCity || validated.locationState)) {
      const parts = [validated.locationCity, validated.locationState, validated.locationCountry].filter(Boolean)
      location = parts.join(', ')
    }

    // Create job with PENDING_ADMIN_REVIEW status
    const job = await db.job.create({
      data: {
        employerId: session.user.employerProfileId,
        title: sanitizePlainText(validated.title, { maxLen: 120 }),
        level: validated.level,
        orgNameOverride: validated.orgNameOverride || null,
        location: sanitizePlainText(location || 'Not specified', { maxLen: 120 }),
        remoteAllowed: validated.remoteAllowed,
        compensationMin: validated.compensationMin ?? validated.salaryMin ?? null,
        compensationMax: validated.compensationMax ?? validated.salaryMax ?? null,
        compensationCurrency: validated.compensationCurrency || 'USD',
        descriptionRich: sanitizePlainText(validated.descriptionRich, { maxLen: 50_000 }),
        keyResponsibilitiesJson: validated.keyResponsibilitiesJson || null,
        requiredExperienceYears: validated.requiredExperienceYears || null,
        requiredLicensesJson: validated.requiredLicensesJson || null,
        requiredCertificationsJson: validated.requiredCertificationsJson || null,
        requiredEhrExperienceJson: validated.requiredEhrExperienceJson || null,
        requiredSettingExperienceJson: validated.requiredSettingExperienceJson || null,
        tierId: validated.tierId,
        status: 'PENDING_ADMIN_REVIEW',
      },
    })

    return createdResponse(
      { jobId: job.id },
      'Job posted successfully. It will be reviewed by an administrator.'
    )
  },
  {
    requireAuth: true,
    requireRole: 'EMPLOYER',
    requireProfile: 'employer',
  }
)

