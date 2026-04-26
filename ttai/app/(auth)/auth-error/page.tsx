import Link from 'next/link'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string }
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Authentication error</h1>
      <p className="text-muted-foreground text-sm">
        {searchParams.error_description || searchParams.error || 'An unexpected error occurred'}
      </p>
      <Link href="/login" className="text-sm text-primary hover:underline">
        Back to login
      </Link>
    </div>
  )
}
