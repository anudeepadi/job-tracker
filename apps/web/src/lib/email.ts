import { Resend } from 'resend'

// Lazy initialization of Resend client (only when actually used, not during build)
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send email verification email
 */
export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`

  try {
    const resend = getResendClient()
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Verify your email - JobTracker',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thanks for signing up for JobTracker! To complete your registration, please verify your email address.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
                ${verificationUrl}
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                This link will expire in 24 hours.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 13px; color: #999; text-align: center;">
                If you didn't create an account with JobTracker, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  try {
    const resend = getResendClient()
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Reset your password - JobTracker',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                You requested to reset your password for your JobTracker account.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
                ${resetUrl}
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                This link will expire in 1 hour.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 13px; color: #999; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}

/**
 * Send job alert notification email
 */
export async function sendJobAlertEmail(params: {
  to: string
  userName: string
  alertName: string
  jobCount: number
  jobs: Array<{
    title: string
    company: string
    location?: string
    salary?: string
    url?: string
  }>
  searchCriteria: {
    role: string
    location?: string
  }
}) {
  const { to, userName, alertName, jobCount, jobs, searchCriteria } = params

  try {
    const resend = getResendClient()

    // Generate job listings HTML
    const jobListingsHtml = jobs
      .map(
        (job) => `
      <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">
          ${job.title}
        </h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
          <strong>${job.company}</strong>${job.location ? ` • ${job.location}` : ''}
        </p>
        ${job.salary ? `<p style="margin: 0 0 12px 0; color: #059669; font-size: 14px; font-weight: 600;">${job.salary}</p>` : ''}
        ${job.url ? `<a href="${job.url}" style="display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">View Job</a>` : ''}
      </div>
    `
      )
      .join('')

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${jobCount} New Jobs Found: ${alertName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Job Alert - ${alertName}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 26px;">🎯 New Jobs Found!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
                ${jobCount} new ${jobCount === 1 ? 'position' : 'positions'} matching "${alertName}"
              </p>
            </div>

            <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 10px;">
                Hi ${userName},
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px;">
                Your job alert <strong>"${alertName}"</strong> (${searchCriteria.role}${searchCriteria.location ? ` in ${searchCriteria.location}` : ''}) has found ${jobCount} new ${jobCount === 1 ? 'match' : 'matches'}:
              </p>

              ${jobListingsHtml}

              ${jobs.length < jobCount ? `
                <div style="text-align: center; margin-top: 20px;">
                  <p style="font-size: 13px; color: #6b7280;">
                    Plus ${jobCount - jobs.length} more ${jobCount - jobs.length === 1 ? 'job' : 'jobs'}...
                  </p>
                  <a href="${APP_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 10px;">
                    View All Jobs
                  </a>
                </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <div style="text-align: center;">
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">
                  Manage your job alerts
                </p>
                <a href="${APP_URL}/settings" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                  Alerts Settings →
                </a>
              </div>

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                You're receiving this email because you set up a job alert on JobTracker.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error sending job alert email:', error)
    return { success: false, error }
  }
}
