import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-muted-foreground text-sm">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>
      <p className="text-xs text-muted-foreground">
        Didn&apos;t receive it? Check your spam folder.
      </p>
      <Link href="/login" className="text-sm text-primary hover:underline">
        Back to login
      </Link>
    </div>
  )
}
