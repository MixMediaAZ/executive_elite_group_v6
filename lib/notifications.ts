/**
 * Notification Helper Utilities
 * Safe, reusable functions for creating notifications throughout the app
 */

import { db } from './db'
import { sendEmailToUser } from './email'
import * as emailTemplates from './email-templates'
import { logger } from './monitoring/logger'

interface CreateNotificationParams {
  userId: string
  type: string // Using String instead of enum for SQLite compatibility
  title: string
  message: string
  linkUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for a user
 * Safe wrapper that handles errors gracefully
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        linkUrl: params.linkUrl,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw - notifications are non-critical
    return null
  }
}

/**
 * Create notification when application is submitted
 */
export async function notifyApplicationReceived(
  employerUserId: string,
  applicationId: string,
  jobTitle: string,
  candidateName: string
) {
  const notification = await createNotification({
    userId: employerUserId,
    type: 'APPLICATION_RECEIVED',
    title: 'New Application Received',
    message: `${candidateName} applied for ${jobTitle}`,
    linkUrl: `/dashboard/applications`,
    metadata: { applicationId, jobTitle, candidateName },
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getApplicationReceivedEmail(jobTitle, candidateName)
  sendEmailToUser(employerUserId, subject, html).catch((err) => {
    logger.error({ err, userId: employerUserId }, 'Failed to send application received email')
  })

  return notification
}

/**
 * Create notification when application status changes
 */
export async function notifyApplicationStatusChanged(
  candidateUserId: string,
  applicationId: string,
  jobTitle: string,
  newStatus: string
) {
  const notification = await createNotification({
    userId: candidateUserId,
    type: 'APPLICATION_STATUS_CHANGED',
    title: 'Application Status Updated',
    message: `Your application for ${jobTitle} is now ${newStatus}`,
    linkUrl: `/dashboard/applications`,
    metadata: { applicationId, jobTitle, status: newStatus },
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getApplicationStatusChangedEmail(jobTitle, newStatus)
  sendEmailToUser(candidateUserId, subject, html).catch((err) => {
    logger.error({ err, userId: candidateUserId }, 'Failed to send application status changed email')
  })

  return notification
}

/**
 * Create notification when job is approved
 */
export async function notifyJobApproved(
  employerUserId: string,
  jobId: string,
  jobTitle: string
) {
  const notification = await createNotification({
    userId: employerUserId,
    type: 'JOB_APPROVED',
    title: 'Job Approved',
    message: `Your job posting "${jobTitle}" has been approved and is now live`,
    linkUrl: `/dashboard/jobs/${jobId}`,
    metadata: { jobId, jobTitle },
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getJobApprovedEmail(jobTitle)
  sendEmailToUser(employerUserId, subject, html).catch((err) => {
    logger.error({ err, userId: employerUserId }, 'Failed to send job approved email')
  })

  return notification
}

/**
 * Create notification when job is rejected
 */
export async function notifyJobRejected(
  employerUserId: string,
  jobId: string,
  jobTitle: string,
  reason?: string
) {
  const notification = await createNotification({
    userId: employerUserId,
    type: 'JOB_REJECTED',
    title: 'Job Rejected',
    message: `Your job posting "${jobTitle}" was not approved${reason ? `: ${reason}` : ''}`,
    linkUrl: `/dashboard/jobs/${jobId}`,
    metadata: { jobId, jobTitle, reason },
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getJobRejectedEmail(jobTitle, reason)
  sendEmailToUser(employerUserId, subject, html).catch((err) => {
    logger.error({ err, userId: employerUserId }, 'Failed to send job rejected email')
  })

  return notification
}

/**
 * Create notification when employer is approved
 */
export async function notifyEmployerApproved(employerUserId: string) {
  const notification = await createNotification({
    userId: employerUserId,
    type: 'EMPLOYER_APPROVED',
    title: 'Account Approved',
    message: 'Your employer account has been approved. You can now post jobs!',
    linkUrl: '/dashboard/jobs/new',
    metadata: {},
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getEmployerApprovedEmail()
  sendEmailToUser(employerUserId, subject, html).catch((err) => {
    logger.error({ err, userId: employerUserId }, 'Failed to send employer approved email')
  })

  return notification
}

/**
 * Create notification when interview is scheduled
 */
export async function notifyInterviewScheduled(
  candidateUserId: string,
  interviewId: string,
  jobTitle: string,
  scheduledAt: Date
) {
  const notification = await createNotification({
    userId: candidateUserId,
    type: 'INTERVIEW_SCHEDULED',
    title: 'Interview Scheduled',
    message: `An interview has been scheduled for ${jobTitle} on ${scheduledAt.toLocaleDateString()}`,
    linkUrl: `/dashboard/applications`,
    metadata: { interviewId, jobTitle, scheduledAt: scheduledAt.toISOString() },
  })

  // Send email notification (fire and forget)
  const { subject, html } = emailTemplates.getInterviewScheduledEmail(jobTitle, scheduledAt)
  sendEmailToUser(candidateUserId, subject, html).catch((err) => {
    logger.error({ err, userId: candidateUserId }, 'Failed to send interview scheduled email')
  })

  return notification
}

/**
 * Create notification when new message is received
 */
export async function notifyNewMessage(
  recipientUserId: string,
  messageId: string,
  senderName: string,
  subject?: string
) {
  const notification = await createNotification({
    userId: recipientUserId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    message: `You received a message from ${senderName}${subject ? `: ${subject}` : ''}`,
    linkUrl: `/dashboard/messages`,
    metadata: { messageId, senderName, subject },
  })

  // Send email notification (fire and forget)
  const { subject: emailSubject, html } = emailTemplates.getNewMessageEmail(senderName, subject)
  sendEmailToUser(recipientUserId, emailSubject, html).catch((err) => {
    logger.error({ err, userId: recipientUserId }, 'Failed to send new message email')
  })

  return notification
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await db.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return null
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return null
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await db.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  } catch (error) {
    console.error('Failed to get unread notification count:', error)
    return 0
  }
}

