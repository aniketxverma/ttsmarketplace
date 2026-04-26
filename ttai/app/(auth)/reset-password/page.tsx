'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<'request' | 'confirm'>('request')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const email = (new FormData(e.currentTarget)).get('email') as string
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?mode=confirm`,
    })
    if (error) { setError(error.message) } else { setSuccess(true) }
    setLoading(false)
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const confirm = fd.get('passwordConfirm') as string

    if (password !== confirm) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message) } else { setSuccess(true) }
    setLoading(false)
  }

  if (success && mode === 'request') {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground text-sm">We sent a reset link to your email address.</p>
        <Link href="/login" className="text-sm text-primary hover:underline">Back to login</Link>
      </div>
    )
  }

  if (success && mode === 'confirm') {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Password updated</h1>
        <p className="text-muted-foreground text-sm">Your password has been changed successfully.</p>
        <Link href="/login" className="text-sm text-primary hover:underline">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'request'
            ? "Enter your email and we'll send a reset link"
            : 'Enter your new password'}
        </p>
      </div>

      {mode === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">New password</label>
            <input id="password" name="password" type="password" required minLength={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label htmlFor="passwordConfirm" className="text-sm font-medium">Confirm password</label>
            <input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}

      <Link href="/login" className="block text-center text-sm text-muted-foreground hover:underline">
        Back to login
      </Link>
    </div>
  )
}
