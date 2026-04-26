'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: 400, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Critical Error</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>A critical error occurred. Please refresh the page.</p>
            <button
              onClick={reset}
              style={{ marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
