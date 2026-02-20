"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// These are hardcoded demo email templates - no user input, safe for dangerouslySetInnerHTML
const SAMPLE_EMAILS = [
  {
    id: "verification",
    label: "Email Verification",
    subject: "Verify your email - HireAgent",
    from: "HireAgent <noreply@hireagent.ai>",
    to: "alex.chen@gmail.com",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thanks for signing up for HireAgent! To complete your registration, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 13px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
            https://app.hireagent.ai/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9...
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 13px; color: #999; text-align: center;">
            If you didn't create an account with HireAgent, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  },
  {
    id: "password-reset",
    label: "Password Reset",
    subject: "Reset your password - HireAgent",
    from: "HireAgent <noreply@hireagent.ai>",
    to: "alex.chen@gmail.com",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            You requested to reset your password for your HireAgent account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 13px; color: #667eea; word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
            https://app.hireagent.ai/reset-password?token=rst_a8f2c9d4e6b1...
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This link will expire in 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 13px; color: #999; text-align: center;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
      </div>
    `,
  },
  {
    id: "job-alert",
    label: "Job Alert",
    subject: "5 New Jobs Found: Senior React Engineer",
    from: "HireAgent <alerts@hireagent.ai>",
    to: "alex.chen@gmail.com",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 26px;">New Jobs Found!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
            5 new positions matching "Senior React Engineer"
          </p>
        </div>
        <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 10px;">Hi Alex,</p>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px;">
            Your job alert <strong>"Senior React Engineer"</strong> (React Engineer in San Francisco, CA) has found 5 new matches:
          </p>

          <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">Senior Frontend Engineer</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Stripe</strong> &bull; San Francisco, CA (Hybrid)</p>
            <p style="margin: 0 0 12px 0; color: #059669; font-size: 14px; font-weight: 600;">$190,000 - $240,000</p>
            <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">View Job</a>
          </div>

          <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">Staff React Engineer</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Vercel</strong> &bull; Remote</p>
            <p style="margin: 0 0 12px 0; color: #059669; font-size: 14px; font-weight: 600;">$200,000 - $260,000</p>
            <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">View Job</a>
          </div>

          <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937;">React Native Lead</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Coinbase</strong> &bull; San Francisco, CA (Remote)</p>
            <p style="margin: 0 0 12px 0; color: #059669; font-size: 14px; font-weight: 600;">$185,000 - $230,000</p>
            <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">View Job</a>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 13px; color: #6b7280;">Plus 2 more jobs...</p>
            <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 10px;">View All Jobs</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">Manage your job alerts</p>
            <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">Alerts Settings &rarr;</a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
            You're receiving this email because you set up a job alert on HireAgent.
          </p>
        </div>
      </div>
    `,
  },
];

export default function EmailDemoPage() {
  const [activeEmail, setActiveEmail] = useState(SAMPLE_EMAILS[0].id);
  const current = SAMPLE_EMAILS.find((e) => e.id === activeEmail)!;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">HireAgent Email Templates</h1>
            <p className="text-sm text-gray-500">
              Preview of transactional emails sent to users
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Email selector tabs */}
        <div className="flex gap-2 mb-6">
          {SAMPLE_EMAILS.map((email) => (
            <button
              key={email.id}
              onClick={() => setActiveEmail(email.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeEmail === email.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
              )}
            >
              {email.label}
            </button>
          ))}
        </div>

        {/* Email preview chrome */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Email header */}
          <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 w-16">
                From:
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {current.from}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 w-16">
                To:
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {current.to}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 w-16">
                Subject:
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {current.subject}
              </span>
            </div>
          </div>

          {/* Email body - static hardcoded HTML only, no user input */}
          <div className="p-6 bg-gray-50 dark:bg-gray-950">
            <div
              className="mx-auto"
              style={{ maxWidth: "640px" }}
              dangerouslySetInnerHTML={{ __html: current.html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
