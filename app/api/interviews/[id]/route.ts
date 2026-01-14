import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { z } from 'zod'

// Define types locally since Prisma uses String types instead of enums for SQLite compatibility
type InterviewStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW'

const updateInterviewSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z
    .enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
    .optional(),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  durationMinutes: z.number().int().positive().optional(),
  interviewerName: z.string().optional(),
  interviewerEmail: z.string().email().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/interviews/[id]
 * Get a specific interview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const interview = await db.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: {
              include: {
                employer: {
                  select: {
                    organizationName: true,
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
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Verify user has access (candidate or employer)
    const isCandidate = interview.application.candidate.userId === session.user.id
    const isEmployer = interview.application.job.employer.userId === session.user.id

    if (!isCandidate && !isEmployer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/interviews/[id]
 * Update an interview (employer only, or candidate can confirm)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateInterviewSchema.parse(body)

    const interview = await db.interview.findUnique({
      where: { id },
      include: {
        application: {
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
              },
            },
          },
        },
      },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const isEmployer = interview.application.job.employer.userId === session.user.id
    const isCandidate = interview.application.candidate.userId === session.user.id

    // Candidates can only confirm interviews
    if (!isEmployer && !isCandidate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (isCandidate && validated.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Candidates can only confirm interviews' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: {
      scheduledAt?: Date
      status?: InterviewStatus
      location?: string
      meetingUrl?: string
      durationMinutes?: number
      interviewerName?: string
      interviewerEmail?: string
      notes?: string
    } = {}

    if (validated.scheduledAt) {
      updateData.scheduledAt = new Date(validated.scheduledAt)
    }
    if (validated.status) {
      updateData.status = validated.status as InterviewStatus
    }
    if (validated.location !== undefined) {
      updateData.location = validated.location
    }
    if (validated.meetingUrl !== undefined) {
      updateData.meetingUrl = validated.meetingUrl
    }
    if (validated.durationMinutes !== undefined) {
      updateData.durationMinutes = validated.durationMinutes
    }
    if (validated.interviewerName !== undefined) {
      updateData.interviewerName = validated.interviewerName
    }
    if (validated.interviewerEmail !== undefined) {
      updateData.interviewerEmail = validated.interviewerEmail
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }

    const updated = await db.interview.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, interview: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Interview update error:', error)
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}

