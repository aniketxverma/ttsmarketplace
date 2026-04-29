import Link from 'next/link'

const LINKS = {
  Platform: [
    { label: 'Marketplace',      href: '/marketplace' },
    { label: 'Store',            href: '/store' },
    { label: 'Suppliers',        href: '/suppliers' },
    { label: 'How It Works',     href: '/#how-it-works' },
  ],
  Suppliers: [
    { label: 'Join as Supplier', href: '/register' },
    { label: 'Supplier Login',   href: '/login' },
    { label: 'Verification',     href: '/supplier/documents' },
    { label: 'Pricing',          href: '/register' },
  ],
  Company: [
    { label: 'About Us',         href: '/' },
    { label: 'Contact',          href: '/' },
    { label: 'Privacy Policy',   href: '/' },
    { label: 'Terms of Service', href: '/' },
  ],
}

const STATS = [
  { value: '50+',  label: 'Countries' },
  { value: '200+', label: 'Suppliers' },
  { value: '5K+',  label: 'Products' },
  { value: '99%',  label: 'Satisfaction' },
]

export function Footer() {
  return (
    <footer className="bg-[#0B1F4D] text-white">

      {/* Stats strip */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-[#F5A623]">{s.value}</p>
                <p className="text-sm text-blue-200 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column — wider */}
          <div className="lg:col-span-2 space-y-5">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#F5A623] border-2 border-[#0B1F4D]" />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[17px] font-black text-white tracking-tight">TTAI</span>
                  <span className="text-[17px] font-black text-[#F5A623] tracking-tight">EMA</span>
                </div>
                <p className="text-[8px] font-bold tracking-[0.18em] text-blue-300 uppercase mt-px">Marketplace</p>
              </div>
            </Link>

            <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
              The global B2B marketplace connecting verified suppliers with buyers across Europe, the Middle East, and Africa.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {['ISO Verified', 'Secure Payments', 'GDPR Compliant'].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
                  <svg className="w-3 h-3 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Instagram', path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z' },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/15 hover:border-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#F5A623]">{heading}</h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-blue-200 hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter row */}
        <div className="mt-12 pt-10 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-white text-sm">Stay updated on trade opportunities</h3>
              <p className="text-blue-300 text-xs mt-1">Get weekly curated supplier news and marketplace updates.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-56 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 focus:border-[#F5A623]/50 transition-all"
              />
              <button className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} TTAI EMA. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Cookies'].map((label) => (
              <Link key={label} href="/" className="text-xs text-blue-300 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>

    </footer>
  )
}
