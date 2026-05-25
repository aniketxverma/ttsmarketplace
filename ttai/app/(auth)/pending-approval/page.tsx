'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-center">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Account Under Review</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Your account has been created successfully and is now waiting for admin approval.
          You will gain full access once approved.
        </p>
      </div>

      {/* Steps */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-left space-y-3">
        {[
          { step: '1', text: 'Registration received ✓' },
          { step: '2', text: 'Admin review in progress…' },
          { step: '3', text: 'Access granted after approval' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {step}
            </div>
            <p className="text-sm text-amber-800 font-medium">{text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Typical review time is <strong>24–48 hours</strong>. You will be contacted via email when approved.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl border border-gray-200 text-gray-600 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
        <Link
          href="/"
          className="w-full rounded-xl bg-[#0B1F4D] text-white py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors text-center block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
