import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { notifyEmployerApproved } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const employerId = body.employerId as string

    if (!employerId) {
      return NextResponse.json({ error: 'Employer ID required' }, { status: 400 })
    }

    // Get employer with user info for notification
    const employer = await db.employerProfile.findUnique({
      where: { id: employerId },
      select: {
        userId: true,
      },
    })

    if (!employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    await db.employerProfile.update({
      where: { id: employerId },
      data: {
        adminApproved: true,
        approvedByAdminId: session.user.id,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actionType: 'employer_approved',
        targetType: 'EmployerProfile',
        targetId: employerId,
        detailsJson: JSON.stringify({ employerId }),
      },
    })

    // Notify employer
    await notifyEmployerApproved(employer.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve employer error:', error)
    return NextResponse.json(
      { error: 'Failed to approve employer' },
      { status: 500 }
    )
  }
}

