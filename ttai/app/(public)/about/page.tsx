import { LegalShell, Section, COMPANY } from '@/components/legal/LegalShell'
import Link from 'next/link'

export const metadata = { title: 'About Us · TTAI EMA', description: 'TTAI EMA — the global B2B marketplace connecting factories, suppliers, distributors and retailers across Europe, the Middle East and Africa.' }

export default function AboutPage() {
  return (
    <LegalShell title="About TTAI EMA" subtitle="Connecting global trade — factories, suppliers, distributors and retailers in one network.">
      <p>TTAI EMA is a global B2B and B2C commerce platform operated by {COMPANY.legal}. We bring factories, suppliers, distributors, sales points and retailers together in a single trusted network spanning Europe, the Middle East and Africa.</p>

      <Section title="What We Do">
        <p>The platform combines an online marketplace with business matchmaking and integrated logistics. Suppliers list their products once; sales points and retailers import them and resell within their own markets, while orders are automatically routed and dropshipped to the end customer — so everyone keeps their margin without holding stock.</p>
      </Section>

      <Section title="Our Mission">
        <p>To make cross-border trade simple, transparent and accessible — giving small and large businesses the same reach, tools and supplier connections that were once reserved for the largest importers.</p>
      </Section>

      <Section title="What We Offer">
        <ul className="list-disc pl-5 space-y-1">
          <li>A verified marketplace of suppliers, distributors and factories.</li>
          <li>Tiered B2B matchmaking that connects buyers with the right partners.</li>
          <li>Automated dropshipping from supplier to end customer.</li>
          <li>Multi-language, multi-region storefronts with localized pricing.</li>
          <li>Logistics, payments and trade support built in.</li>
        </ul>
      </Section>

      <Section title="The Company Behind TTAI">
        <p className="font-semibold text-[#0B1F4D]">{COMPANY.legal}</p>
        <p>CIF: {COMPANY.cif}</p>
        <p>{COMPANY.address}</p>
        <p>Email: <a href={`mailto:${COMPANY.email}`} className="text-[#2563eb] hover:underline">{COMPANY.email}</a></p>
      </Section>

      <div className="pt-2">
        <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold hover:bg-[#13306e] transition-colors">
          Get in touch
        </Link>
      </div>
    </LegalShell>
  )
}
