import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withApiHandler, successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { z } from 'zod'
import type { Notification } from '@prisma/client'

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
const querySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export const GET = withApiHandler(
  async (request: NextRequest, { session }) => {
    const { searchParams } = new URL(request.url)
    const validated = validateBody(querySchema, {
      unread: searchParams.get('unread') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    const unreadOnly = validated.unread === 'true'

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: validated.limit,
    })

    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, read: false },
    })

    return successResponse({ notifications, unreadCount })
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:notifications', limit: 60, windowSeconds: 60 },
  }
)

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
const patchSchema = z.union([
  z.object({ markAll: z.literal(true) }),
  z.object({ notificationId: z.string().min(1) }),
])

export const PATCH = withApiHandler(
  async (request: NextRequest, { session }) => {
    const body = await request.json()
    const validated = validateBody(patchSchema, body)

    if ('markAll' in validated && validated.markAll) {
      await db.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true, readAt: new Date() },
      })
      return successResponse({ markAll: true }, 'All notifications marked as read')
    }

    if ('notificationId' in validated) {
      const notification = await db.notification.update({
        where: { id: validated.notificationId, userId: session.user.id },
        data: { read: true, readAt: new Date() },
      })
      return successResponse({ markAll: false, notification })
    }

    return errorResponse('notificationId or markAll required', 400)
  },
  {
    requireAuth: true,
    rateLimit: { keyPrefix: 'rl:notifications', limit: 60, windowSeconds: 60 },
  }
)

