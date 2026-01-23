/**
 * Email Templates
 * HTML email templates for various notification types
 */

const BASE_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://www.executiveelitegroup.com'

function getBaseTemplate(title: string, content: string, buttonText?: string, buttonUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Executive Elite Group</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
    <div style="color: #4b5563;">
      ${content}
    </div>
    ${buttonText && buttonUrl ? `
    <div style="margin-top: 30px; text-align: center;">
      <a href="${BASE_URL}${buttonUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${buttonText}</a>
    </div>
    ` : ''}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
      This is an automated message from Executive Elite Group.<br>
      If you have questions, please contact support.
    </p>
  </div>
</body>
</html>
  `.trim()
}

export function getApplicationReceivedEmail(jobTitle: string, candidateName: string): { subject: string; html: string } {
  const subject = `New Application: ${jobTitle}`
  const html = getBaseTemplate(
    'New Application Received',
    `
      <p>You have received a new application for your job posting:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${jobTitle}</p>
      <p><strong>Candidate:</strong> ${candidateName}</p>
      <p>Review the application in your dashboard to learn more about this candidate.</p>
    `,
    'View Application',
    '/dashboard/applications'
  )
  return { subject, html }
}

export function getApplicationStatusChangedEmail(jobTitle: string, newStatus: string): { subject: string; html: string } {
  const subject = `Application Status Update: ${jobTitle}`
  const html = getBaseTemplate(
    'Application Status Updated',
    `
      <p>Your application status has been updated:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${jobTitle}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p>Check your dashboard for more details.</p>
    `,
    'View Applications',
    '/dashboard/applications'
  )
  return { subject, html }
}

export function getJobApprovedEmail(jobTitle: string): { subject: string; html: string } {
  const subject = `Job Approved: ${jobTitle}`
  const html = getBaseTemplate(
    'Job Approved',
    `
      <p>Great news! Your job posting has been approved and is now live:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${jobTitle}</p>
      <p>Candidates can now view and apply to your job posting.</p>
    `,
    'View Job',
    '/dashboard/jobs'
  )
  return { subject, html }
}

export function getJobRejectedEmail(jobTitle: string, reason?: string): { subject: string; html: string } {
  const subject = `Job Posting Update: ${jobTitle}`
  const html = getBaseTemplate(
    'Job Posting Update',
    `
      <p>Your job posting requires attention:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${jobTitle}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please review and update your job posting as needed.</p>
    `,
    'View Job',
    '/dashboard/jobs'
  )
  return { subject, html }
}

export function getEmployerApprovedEmail(): { subject: string; html: string } {
  const subject = 'Account Approved - Start Posting Jobs!'
  const html = getBaseTemplate(
    'Account Approved',
    `
      <p>Congratulations! Your employer account has been approved.</p>
      <p>You can now post job listings and start finding the perfect candidates for your organization.</p>
    `,
    'Post a Job',
    '/dashboard/jobs/new'
  )
  return { subject, html }
}

export function getInterviewScheduledEmail(jobTitle: string, scheduledAt: Date): { subject: string; html: string } {
  const formattedDate = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const subject = `Interview Scheduled: ${jobTitle}`
  const html = getBaseTemplate(
    'Interview Scheduled',
    `
      <p>An interview has been scheduled for the following position:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${jobTitle}</p>
      <p><strong>Scheduled Date & Time:</strong> ${formattedDate}</p>
      <p>Please check your dashboard for interview details and any additional instructions.</p>
    `,
    'View Interview Details',
    '/dashboard/applications'
  )
  return { subject, html }
}

export function getNewMessageEmail(senderName: string, subject?: string): { subject: string; html: string } {
  const emailSubject = subject ? `New Message: ${subject}` : 'New Message Received'
  const html = getBaseTemplate(
    'New Message',
    `
      <p>You have received a new message from:</p>
      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">${senderName}</p>
      ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      <p>Log in to your dashboard to read and respond to the message.</p>
    `,
    'View Messages',
    '/dashboard/messages'
  )
  return { subject: emailSubject, html }
}
