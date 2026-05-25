'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AccountRejectedPage() {
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
        <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Account Not Approved</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Unfortunately, your account application was not approved at this time.
          Please contact us if you believe this is a mistake.
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-left">
        <p className="text-sm text-red-800 font-medium">Possible reasons for rejection:</p>
        <ul className="mt-2 space-y-1 text-xs text-red-700 list-disc list-inside">
          <li>Incomplete or inaccurate registration information</li>
          <li>Business activity not aligned with our platform</li>
          <li>Duplicate account detected</li>
        </ul>
      </div>

      {/* Contact */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4">
        <p className="text-sm text-gray-600 font-medium">Need help? Contact us:</p>
        <a
          href="mailto:support@tts.es"
          className="text-[#0B1F4D] font-bold text-sm hover:underline"
        >
          support@tts.es
        </a>
      </div>

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
