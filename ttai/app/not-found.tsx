import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
