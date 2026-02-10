'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, X } from 'lucide-react'
import { toast } from 'sonner'

export function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Check for verification success
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully!')
      refreshUser()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('error')) {
      const error = params.get('error')
      if (error === 'invalid_token') {
        toast.error('Invalid verification link')
      } else if (error === 'token_expired') {
        toast.error('Verification link expired. Please request a new one.')
      }
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [refreshUser])

  const handleResend = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  if (!user || user.emailVerified || dismissed) {
    return null
  }

  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong className="font-semibold">Please verify your email address.</strong>
            <p className="mt-1">
              We sent a verification link to <strong>{user.email}</strong>.
              Check your inbox and click the link to verify your account.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={sending}
              className="p-0 h-auto font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
            >
              {sending ? 'Sending...' : 'Resend verification email'}
            </Button>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 h-auto p-1 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
