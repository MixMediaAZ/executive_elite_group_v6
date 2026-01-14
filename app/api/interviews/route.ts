import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { notifyInterviewScheduled } from '@/lib/notifications'
import { z } from 'zod'

const createInterviewSchema = z.object({
  applicationId: z.string(),
  scheduledAt: z.string().datetime(),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  durationMinutes: z.number().int().positive().optional(),
  interviewerName: z.string().optional(),
  interviewerEmail: z.string().email().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/interviews
 * Get interviews for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const upcomingOnly = searchParams.get('upcoming') === 'true'

    // Get user's applications (as candidate or employer)
    let applicationIds: string[] = []

    if (session.user.role === 'CANDIDATE' && session.user.candidateProfileId) {
      const applications = await db.application.findMany({
        where: { candidateId: session.user.candidateProfileId },
        select: { id: true },
      })
      applicationIds = applications.map((app: { id: string }) => app.id)
    } else if (session.user.role === 'EMPLOYER' && session.user.employerProfileId) {
      const jobs = await db.job.findMany({
        where: { employerId: session.user.employerProfileId },
        select: { id: true },
      })
      const applications = await db.application.findMany({
        where: { jobId: { in: jobs.map((j: { id: string }) => j.id) } },
        select: { id: true },
      })
      applicationIds = applications.map((app: { id: string }) => app.id)
    }

    if (applicationIds.length === 0) {
      return NextResponse.json({ interviews: [] })
    }

    const where: {
      applicationId: { in: string[] } | string
      scheduledAt?: { gte: Date }
    } = {
      applicationId: applicationId
        ? applicationId
        : { in: applicationIds },
    }

    if (upcomingOnly) {
      where.scheduledAt = { gte: new Date() }
    }

    const interviews = await db.interview.findMany({
      where,
      include: {
        application: {
          include: {
            job: {
              select: {
                title: true,
                employer: {
                  select: {
                    organizationName: true,
                  },
                },
              },
            },
            candidate: {
              select: {
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Interviews fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/interviews
 * Create a new interview (employer only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: 'Only employers can schedule interviews' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createInterviewSchema.parse(body)

    // Verify application exists and belongs to employer's job
    const application = await db.application.findUnique({
      where: { id: validated.applicationId },
      include: {
        job: {
          include: {
            employer: {
              select: {
                userId: true,
              },
            },
          },
        },
        candidate: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify employer owns this job
    if (application.job.employer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this application' },
        { status: 403 }
      )
    }

    // Create interview
    const interview = await db.interview.create({
      data: {
        applicationId: validated.applicationId,
        scheduledAt: new Date(validated.scheduledAt),
        location: validated.location,
        meetingUrl: validated.meetingUrl,
        durationMinutes: validated.durationMinutes || 60,
        interviewerName: validated.interviewerName,
        interviewerEmail: validated.interviewerEmail,
        notes: validated.notes,
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: {
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    // Update application status to INTERVIEW
    await db.application.update({
      where: { id: validated.applicationId },
      data: {
        status: 'INTERVIEW',
      },
    })

    // Notify candidate
    await notifyInterviewScheduled(
      application.candidate.userId,
      interview.id,
      application.job.title,
      interview.scheduledAt
    )

    return NextResponse.json({ success: true, interview }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    )
  }
}

