import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

/**
 * GET /api/messages/[id]
 * Get a specific message with thread
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
    const message = await db.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            candidateProfile: {
              select: {
                fullName: true,
              },
            },
            employerProfile: {
              select: {
                orgName: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            candidateProfile: {
              select: {
                fullName: true,
              },
            },
            employerProfile: {
              select: {
                orgName: true,
              },
            },
          },
        },
        application: {
          select: {
            id: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
        parentMessage: {
          select: {
            id: true,
            subject: true,
            body: true,
            sender: {
              select: {
                email: true,
              },
            },
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                email: true,
                candidateProfile: {
                  select: {
                    fullName: true,
                  },
                },
                employerProfile: {
                  select: {
                    orgName: true,
                  },
                },
              },
            },
          },
          orderBy: { sentAt: 'asc' },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user has access to this message
    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mark as read if user is recipient
    if (message.recipientId === session.user.id && !message.read) {
      await db.message.update({
        where: { id },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/messages/[id]
 * Update message (mark as read/unread)
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
    const { read } = body as { read?: boolean }

    const message = await db.message.findUnique({
      where: { id },
      select: { recipientId: true },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only recipient can mark as read/unread
    if (message.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await db.message.update({
      where: { id },
      data: {
        read: read ?? true,
        readAt: read ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, message: updated })
  } catch (error) {
    console.error('Message update error:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

