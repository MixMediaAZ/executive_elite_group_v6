import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

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

    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'SUSPENDED',
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'REJECT_JOB',
        targetType: 'Job',
        targetId: jobId,
        details: JSON.stringify({ jobId }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject job error:', error)
    return NextResponse.json(
      { error: 'Failed to reject job' },
      { status: 500 }
    )
  }
}

