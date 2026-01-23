/**
 * Email Service - MailerSend Integration
 * Sends transactional emails using MailerSend REST API
 */

import { logger } from './monitoring/logger'
import { db } from './db'

const MAILERSEND_API_URL = 'https://api.mailersend.com/v1'
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || 'noreply@executiveelitegroup.com'
const FROM_NAME = process.env.MAILERSEND_FROM_NAME || 'Executive Elite Group'

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.MAILERSEND_API_KEY)
}

/**
 * Get user email address from database
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    return user?.email || null
  } catch (error) {
    logger.error({ err: error instanceof Error ? { message: error.message } : { message: String(error) }, userId }, 'Failed to get user email')
    return null
  }
}

/**
 * Send email using MailerSend REST API
 */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    logger.warn('Email service not configured (MAILERSEND_API_KEY missing)')
    return false
  }

  const apiKey = process.env.MAILERSEND_API_KEY!

  try {
    const response = await fetch(`${MAILERSEND_API_URL}/email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        to: [
          {
            email: params.to,
          },
        ],
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>/g, ''),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(
        { status: response.status, error: errorText, to: params.to },
        'MailerSend API error'
      )
      return false
    }

    logger.info({ to: params.to, subject: params.subject }, 'Email sent successfully')
    return true
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message } : { message: String(error) }, to: params.to },
      'Failed to send email'
    )
    return false
  }
}

/**
 * Send email to user by userId
 */
export async function sendEmailToUser(
  userId: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  const email = await getUserEmail(userId)
  if (!email) {
    logger.warn({ userId }, 'User email not found, cannot send email')
    return false
  }

  return sendEmail({ to: email, subject, html, text })
}
