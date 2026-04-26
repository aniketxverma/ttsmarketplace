import Link from 'next/link'
import { redirect } from 'next/navigation'

const PILLARS = [
  {
    icon: '🏪',
    title: 'B2B Marketplace',
    description: 'Connect directly with verified suppliers. Browse thousands of wholesale products across all industries.',
  },
  {
    icon: '🚚',
    title: 'Logistics Hub',
    description: 'Integrated freight and logistics solutions. Track shipments, manage customs, optimize routes.',
  },
  {
    icon: '⚡',
    title: 'Instant Transport',
    description: 'Same-day and next-day delivery in supported cities. Real-time carrier matching for urgent orders.',
  },
  {
    icon: '💳',
    title: 'Trade Finance',
    description: 'Invoice factoring, letters of credit, and payment terms. Unlock cash flow for your business.',
  },
]

export default function HomePage({ searchParams }: { searchParams: { code?: string } }) {
  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}`)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Global Trade Ecosystem
          </h1>
          <p className="text-lg text-muted-foreground">
            The all-in-one platform for B2B wholesale trade and B2C city retail. Connect with verified suppliers, automate VAT compliance, and scale globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/marketplace"
              className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Wholesale
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Join as Supplier
            </Link>
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need to trade globally</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-card rounded-xl border p-6 space-y-3">
                <div className="text-3xl">{p.icon}</div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Ready to start trading?</h2>
          <p className="text-muted-foreground">
            Join thousands of suppliers and buyers already using TTAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create free account
            </Link>
            <Link
              href="/store"
              className="rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Shop local store
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
