import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { notifyNewMessage } from '@/lib/notifications'
import { withApiHandler, validateBody, successResponse, errorResponse } from '@/lib/api-helpers'
import { sendMessageSchema, messagesQuerySchema } from '@/lib/validation-schemas'
import { getUserDisplayNameFromObject } from '@/lib/user-helpers'
import { sanitizePlainText } from '@/lib/security/sanitize'

/**
 * GET /api/messages
 * Get messages for the current user (inbox or sent)
 */
export const GET = withApiHandler(
  async (request: NextRequest, { session }) => {
    const { searchParams } = new URL(request.url)
    const queryParams = {
      folder: searchParams.get('folder') || 'inbox',
      applicationId: searchParams.get('applicationId') || undefined,
      limit: searchParams.get('limit') || '50',
    }
    const validated = messagesQuerySchema.parse(queryParams)

    if (validated.folder === 'sent') {
      const messages = await db.message.findMany({
        where: {
          senderId: session.user.id,
          ...(validated.applicationId && { applicationId: validated.applicationId }),
        },
        include: {
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
        },
        orderBy: { sentAt: 'desc' },
        take: validated.limit,
      })

      return successResponse({ messages })
    }

    // Inbox (received messages)
    const messages = await db.message.findMany({
      where: {
        recipientId: session.user.id,
        ...(validated.applicationId && { applicationId: validated.applicationId }),
      },
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
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: validated.limit,
    })

    const unreadCount = await db.message.count({
      where: {
        recipientId: session.user.id,
        read: false,
      },
    })

    return successResponse({
      messages,
      unreadCount,
    })
  },
  {
    requireAuth: true,
  }
)

/**
 * POST /api/messages
 * Send a new message
 */
export const POST = withApiHandler(
  async (request: NextRequest, { session }) => {
    const body = await request.json()
    const validated = validateBody(sendMessageSchema, body)

    // Verify recipient exists
    const recipient = await db.user.findUnique({
      where: { id: validated.recipientId },
      select: { id: true, email: true },
    })

    if (!recipient) {
      return errorResponse('Recipient not found', 404)
    }

    // If applicationId is provided, verify it exists and user has access
    if (validated.applicationId) {
      const application = await db.application.findUnique({
        where: { id: validated.applicationId },
        include: {
          candidate: { select: { userId: true } },
          job: { select: { employer: { select: { userId: true } } } },
        },
      })

      if (!application) {
        return errorResponse('Application not found', 404)
      }

      // Verify user is either the candidate or employer for this application
      const isCandidate = application.candidate.userId === session.user.id
      const isEmployer = application.job.employer.userId === session.user.id

      if (!isCandidate && !isEmployer) {
        return errorResponse('You do not have access to this application', 403)
      }
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        recipientId: validated.recipientId,
        applicationId: validated.applicationId,
        type: validated.type,
        subject: validated.subject ? sanitizePlainText(validated.subject, { maxLen: 200 }) : null,
        body: sanitizePlainText(validated.body, { maxLen: 20_000 }),
        parentMessageId: validated.parentMessageId,
      },
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
        recipient: {
          select: {
            email: true,
          },
        },
      },
    })

    // Send notification to recipient (fire and forget)
    const senderName = getUserDisplayNameFromObject(message.sender)

    notifyNewMessage(
      validated.recipientId,
      message.id,
      senderName,
      validated.subject || undefined
    ).catch((err: unknown) => {
      // Log but don't fail the request
      console.error('Failed to send message notification:', err)
    })

    return successResponse({ message }, 'Message sent successfully')
  },
  {
    requireAuth: true,
  }
)

