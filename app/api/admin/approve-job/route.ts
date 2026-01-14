import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { notifyJobApproved } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const jobId = body.jobId as string

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Get job with employer info for notification
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'LIVE',
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'APPROVE_JOB',
        targetType: 'Job',
        targetId: jobId,
        details: JSON.stringify({ jobId }),
      },
    })

    // Notify employer
    await notifyJobApproved(job.employer.userId, jobId, job.title)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve job error:', error)
    return NextResponse.json(
      { error: 'Failed to approve job' },
      { status: 500 }
    )
  }
}

