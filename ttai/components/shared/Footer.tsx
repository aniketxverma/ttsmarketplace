import Link from 'next/link'
import { Logo } from '@/components/Logo'

const LINKS = {
  Departments: [
    { label: 'Marketplace',          href: '/marketplace' },
    { label: 'Logistics Hub',        href: '/logistics' },
    { label: 'Business Consulting',  href: '/consulting' },
    { label: 'Contact a Team',       href: '/contact' },
  ],
  Shop: [
    { label: 'Retail Store',     href: '/store' },
    { label: 'Business Shop',    href: '/marketplace' },
    { label: 'Outlet Zone',      href: '/outlet' },
    { label: 'Trade Hub',        href: '/b2b' },
    { label: 'Channels',         href: '/channels' },
  ],
  Platform: [
    { label: 'Marketplace',      href: '/marketplace' },
    { label: 'Suppliers',        href: '/suppliers' },
    { label: 'Regions',          href: '/regions/europe' },
    { label: 'Pricing',          href: '/pricing' },
  ],
  Suppliers: [
    { label: 'Join as Supplier', href: '/register' },
    { label: 'Supplier Login',   href: '/login' },
    { label: 'Verification',     href: '/supplier/documents' },
    { label: 'Become a Seller',  href: '/register' },
  ],
  Company: [
    { label: 'About Us',         href: '/about' },
    { label: 'Contact',          href: '/contact' },
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

const PAYMENTS = ['stripe', 'VISA', 'mastercard', 'PayPal', 'DHL', 'FedEx']

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#0a1733] to-[#0B1F4D] text-white overflow-hidden">
      {/* gold accent line + glow */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#F5A623] to-transparent opacity-60" />
      <div className="absolute -top-24 -right-20 w-[420px] h-[420px] rounded-full bg-[#F5A623]/[0.07] blur-3xl pointer-events-none" />

      {/* Main grid */}
      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-x-8 gap-y-10">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2 space-y-5">
            <Logo variant="light" size="lg" />
            <p className="text-blue-200/80 text-sm leading-relaxed max-w-xs">
              The global B2B marketplace connecting factories, suppliers, distributors and
              retailers across Europe, the Middle East, and Africa.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ISO Verified', 'Secure Payments', 'GDPR Compliant'].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5">
                  <svg className="w-3 h-3 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              {[
                { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Instagram', path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z' },
              ].map((s) => (
                <button key={s.label} aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/15 hover:border-white/20 transition-colors">
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Legal entity */}
            <div className="pt-4 mt-1 border-t border-white/10 text-xs text-blue-300/70 leading-relaxed space-y-0.5">
              <p className="font-bold text-blue-200">FULL SOFTRONIC S.L.</p>
              <p>CIF: B52038130</p>
              <p>Calle Sor Alegría, 4 - Local 1, 52002 Melilla, Spain</p>
              <p><a href="mailto:info@ttaiema.com" className="hover:text-white transition-colors">info@ttaiema.com</a></p>
              <p className="flex gap-2"><a href="https://www.ttaiema.com" className="hover:text-white transition-colors">ttaiema.com</a><span>·</span><a href="https://www.ttai.es" className="hover:text-white transition-colors">ttai.es</a></p>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#F5A623]">{heading}</h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-blue-200/80 hover:text-white transition-colors hover:translate-x-0.5 inline-block">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-10 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-white text-sm">Stay updated on trade opportunities</h3>
              <p className="text-blue-300/80 text-xs mt-1">Get weekly curated supplier news and marketplace updates.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="email" placeholder="your@email.com"
                className="flex-1 md:w-56 rounded-xl bg-white/[0.08] border border-white/15 px-4 py-2.5 text-sm text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 focus:border-[#F5A623]/50 transition-all" />
              <button className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2.5 text-sm font-bold hover:bg-[#fbb93a] transition-colors flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Payment / courier strip */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300/60">Trusted global commerce</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {PAYMENTS.map((p) => (
              <span key={p} className="text-base font-black text-white/70">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-blue-300/80">© {new Date().getFullYear()} TTAI EMA — FULL SOFTRONIC S.L. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact']].map(([label, href]) => (
              <Link key={label} href={href} className="text-xs text-blue-300/80 hover:text-white transition-colors">{label}</Link>
            ))}
            <span className="text-xs text-blue-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
