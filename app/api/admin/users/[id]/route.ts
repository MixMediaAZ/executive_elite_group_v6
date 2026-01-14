import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

// Define types locally since Prisma uses String types instead of enums for SQLite compatibility
type UserRole = 'CANDIDATE' | 'EMPLOYER' | 'ADMIN'
type UserStatus = 'ACTIVE' | 'SUSPENDED'

const allowedRoles: UserRole[] = ['CANDIDATE', 'EMPLOYER', 'ADMIN']
const allowedStatuses: UserStatus[] = ['ACTIVE', 'SUSPENDED']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionHelper()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { role, status } = body as {
      role?: UserRole
      status?: UserStatus
    }

    if (!role && !status) {
      return NextResponse.json(
        { error: 'Role or status must be provided' },
        { status: 400 }
      )
    }

    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (session.user.id === userId && status && status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'You cannot suspend yourself' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: role ?? undefined,
        status: status ?? undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'UPDATE_USER',
        targetType: 'User',
        targetId: userId,
        details: {
          updatedRole: role,
          updatedStatus: status,
        },
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

