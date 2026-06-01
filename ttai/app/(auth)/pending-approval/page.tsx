'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  full_name:    string | null
  phone:        string | null
  role:         string | null
  company_name: string | null
  country_name: string | null
  bio:          string | null
  approval_status: string | null
}

const ROLE_LABELS: Record<string, string> = {
  buyer:           'Buyer',
  business_client: 'Business Client',
  supplier:        'Supplier',
  broker:          'Broker',
}

const ROLE_DASHBOARD: Record<string, string> = {
  buyer:           '/buyer',
  business_client: '/buyer',
  supplier:        '/supplier',
  broker:          '/broker',
  admin:           '/admin',
}

export default function PendingApprovalPage() {
  const router  = useRouter()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [email, setEmail]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Load profile on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? null)
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, role, company_name, country_name, bio, approval_status')
        .eq('id', user.id)
        .single()

      const meta = user.user_metadata ?? {}
      const status = data?.approval_status ?? 'pending'

      // Already approved or rejected — redirect immediately
      if (status === 'approved') {
        const dest = ROLE_DASHBOARD[data?.role ?? ''] ?? '/buyer'
        router.replace(dest)
        return
      }
      if (status === 'rejected') {
        router.replace('/account-rejected')
        return
      }

      setProfile({
        full_name:       data?.full_name    ?? meta.full_name    ?? null,
        phone:           data?.phone        ?? meta.phone        ?? null,
        role:            data?.role         ?? meta.role         ?? null,
        company_name:    data?.company_name ?? meta.company_name ?? null,
        country_name:    data?.country_name ?? meta.country_name ?? null,
        bio:             data?.bio          ?? meta.bio          ?? null,
        approval_status: status,
      })
      setLoading(false)
    }
    load()
  }, [router])

  // Poll every 10 seconds for status change
  const pollStatus = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('approval_status, role')
      .eq('id', userId)
      .single()

    if (data?.approval_status === 'approved') {
      const dest = ROLE_DASHBOARD[data?.role ?? ''] ?? '/buyer'
      router.replace(dest)
    } else if (data?.approval_status === 'rejected') {
      router.replace('/account-rejected')
    }
  }, [userId, router])

  useEffect(() => {
    if (!userId) return
    const interval = setInterval(pollStatus, 10000)
    return () => clearInterval(interval)
  }, [userId, pollStatus])

  async function handleManualCheck() {
    setChecking(true)
    await pollStatus()
    setChecking(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex justify-center">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-[#0B1F4D] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

      {/* ── Top status bar ── */}
      <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1a3580] px-6 py-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-4 border-amber-400/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="absolute inset-0 rounded-full animate-ping bg-amber-400/20" />
          </div>
        </div>
        <h1 className="text-white font-extrabold text-xl">Application Received!</h1>
        <p className="text-blue-200 text-sm mt-1">
          We&apos;re reviewing your profile and will get back to you within{' '}
          <strong className="text-amber-300">24–48 hours</strong>
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">

        {/* ── Timeline ── */}
        <div className="flex items-start gap-0">
          {[
            { label: 'Submitted',    done: true,  active: false },
            { label: 'Under Review', done: false, active: true  },
            { label: 'Approved',     done: false, active: false },
          ].map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {i > 0 && <div className={`flex-1 h-0.5 ${s.done || s.active ? 'bg-amber-400' : 'bg-gray-200'}`} />}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                  ${s.done   ? 'bg-[#F5A623] border-[#F5A623]'
                  : s.active ? 'bg-white border-amber-400 shadow-md shadow-amber-100'
                             : 'bg-gray-50 border-gray-200'}`}>
                  {s.done
                    ? <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    : s.active
                    ? <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    : <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${s.done ? 'bg-amber-400' : 'bg-gray-200'}`} />}
              </div>
              <p className={`text-[11px] font-semibold mt-1.5 text-center
                ${s.done ? 'text-[#F5A623]' : s.active ? 'text-amber-500' : 'text-gray-300'}`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Auto-check notice ── */}
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <p className="text-xs text-green-700 flex-1">
            Checking automatically every 10 seconds — you&apos;ll be redirected instantly when approved.
          </p>
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="text-xs font-bold text-green-700 hover:text-green-900 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {checking ? 'Checking…' : 'Check now'}
          </button>
        </div>

        {/* ── Submitted profile summary ── */}
        {profile && (
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your submitted profile</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Name',    value: profile.full_name },
                { label: 'Email',   value: email },
                { label: 'Phone',   value: profile.phone },
                { label: 'Role',    value: ROLE_LABELS[profile.role ?? ''] ?? profile.role },
                { label: 'Company', value: profile.company_name },
                { label: 'Country', value: profile.country_name },
                { label: 'About',   value: profile.bio },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label} className="flex gap-4 px-4 py-2.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-sm text-gray-700 break-words flex-1">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Email notice ── */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3.5 flex gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            A confirmation was sent to <strong>{email}</strong>. You will receive another email once approved.
            Check your spam folder if you don&apos;t see it.
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full rounded-xl bg-[#0B1F4D] text-white py-3 text-sm font-bold
              hover:bg-[#162d6e] transition-colors text-center block"
          >
            Back to Home
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl border border-gray-200 text-gray-500 py-2.5 text-sm font-medium
              hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
