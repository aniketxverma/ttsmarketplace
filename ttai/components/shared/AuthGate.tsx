'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, Lock, LogIn, UserPlus } from 'lucide-react'

// Cache the auth check across the page so repeated gate clicks are instant.
let cachedAuthed: boolean | null = null

/**
 * Gate an action behind sign-in. Browsing stays open; the action only runs when
 * the visitor is logged in — otherwise a "sign in to continue" prompt appears
 * (Google, register or email login).
 *
 *   const { gate, modal } = useAuthGate()
 *   <button onClick={() => gate(() => doThing())}>…</button>
 *   {modal}
 */
export function useAuthGate(opts?: { title?: string; subtitle?: string }) {
  const [show, setShow] = useState(false)

  const gate = useCallback(async (action: () => void) => {
    if (cachedAuthed === null) {
      try { const { data } = await createClient().auth.getUser(); cachedAuthed = !!data.user }
      catch { cachedAuthed = false }
    }
    if (cachedAuthed) action()
    else setShow(true)
  }, [])

  const modal = show ? <AuthPrompt onClose={() => setShow(false)} title={opts?.title} subtitle={opts?.subtitle} /> : null
  return { gate, modal }
}

function AuthPrompt({ onClose, title, subtitle }: { onClose: () => void; title?: string; subtitle?: string }) {
  const [busy, setBusy] = useState(false)
  const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'

  async function google() {
    setBusy(true)
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (error) { setBusy(false); alert('Google sign-in is not enabled yet. Please register or log in.') }
    } catch { setBusy(false); alert('Google sign-in is not available. Please register or log in.') }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        <div className="w-12 h-12 rounded-2xl bg-[#0B1F4D]/5 flex items-center justify-center mx-auto"><Lock className="w-6 h-6 text-[#0B1F4D]" /></div>
        <h3 className="text-lg font-extrabold text-[#0B1F4D] text-center mt-3">{title ?? 'Sign in to continue'}</h3>
        <p className="text-sm text-gray-500 text-center mt-1">{subtitle ?? 'Create a free account or sign in to continue. Browsing stays open to everyone.'}</p>

        <button onClick={google} disabled={busy}
          className="mt-5 w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
          <GoogleG /> {busy ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-3"><span className="flex-1 h-px bg-gray-100" /><span className="text-[11px] text-gray-400 font-semibold">or</span><span className="flex-1 h-px bg-gray-100" /></div>

        <Link href={`/register?next=${encodeURIComponent(next)}`} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-4 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors">
          <UserPlus className="w-4 h-4" /> Create free account
        </Link>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <LogIn className="w-4 h-4" /> Log in
        </Link>
      </div>
    </div>
  )
}

function GoogleG() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
  )
}
