import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { getJobTemplate } from '@/lib/job-seed-templates'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateKey, employerId, tierId } = body as {
      templateKey?: string
      employerId?: string
      tierId?: string
    }

    if (!templateKey || !employerId || !tierId) {
      return NextResponse.json(
        { error: 'templateKey, employerId, and tierId are required' },
        { status: 400 }
      )
    }

    const template = getJobTemplate(templateKey)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const employer = await db.employerProfile.findUnique({
      where: { id: employerId },
      select: { id: true, organizationName: true },
    })

    if (!employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    const tier = await db.tier.findUnique({
      where: { id: tierId },
      select: { id: true },
    })

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    const job = await db.job.create({
      data: {
        employerId: employer.id,
        tierId: tier.id,
        title: template.title,
        level: template.level,
        department: template.department,
        locationCity: template.locationCity,
        locationState: template.locationState,
        locationCountry: template.locationCountry,
        remoteAllowed: template.remoteAllowed ?? false,
        hybridAllowed: template.hybridAllowed ?? false,
        salaryMin: template.salaryMin ?? null,
        salaryMax: template.salaryMax ?? null,
        salaryCurrency: template.salaryCurrency ?? 'usd',
        descriptionRich: buildDescription(template),
        keyResponsibilities: template.responsibilities,
        requiredExperienceYears: undefined,
        requiredLicenses: undefined,
        requiredCertifications: undefined,
        requiredEhrExperience: undefined,
        requiredSettingExperience: undefined,
        status: 'LIVE',
        expiresAt: null,
      },
    })

    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SEED_JOB',
        targetType: 'Job',
        targetId: job.id,
        details: {
          templateKey,
          employerId,
          tierId,
        },
      },
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Job seed error:', error)
    return NextResponse.json({ error: 'Failed to seed job' }, { status: 500 })
  }
}

function buildDescription(template: ReturnType<typeof getJobTemplate>) {
  if (!template) {
    return ''
  }

  return `
    <p>${template.summary}</p>
    <h3>Key Responsibilities</h3>
    <ul>
      ${template.responsibilities.map((item) => `<li>${item}</li>`).join('')}
    </ul>
    <h3>Requirements</h3>
    <ul>
      ${template.requirements.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `
}

