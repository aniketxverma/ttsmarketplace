import { LegalShell, Section, COMPANY } from '@/components/legal/LegalShell'

export const metadata = { title: 'Terms of Service · TTAI EMA', description: 'The terms governing use of the TTAI and TTAIEMA platforms.' }

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" subtitle="The terms governing use of the TTAI and TTAIEMA platforms." updated="June 2026">
      <p>By accessing and using the TTAI and TTAIEMA platforms, users agree to the following terms.</p>

      <Section title="Services">
        <p>TTAI provides business consulting, marketplace access, logistics support, supplier and buyer connections, international trade services and related business tools.</p>
      </Section>

      <Section title="User Responsibilities">
        <p>Users agree to provide accurate information and to use the platform responsibly and legally.</p>
      </Section>

      <Section title="Business Relationships">
        <p>TTAI acts as a facilitator of business opportunities and connections. Users remain responsible for their own commercial agreements and transactions.</p>
      </Section>

      <Section title="Intellectual Property">
        <p>All platform content, branding, graphics, designs and materials remain the property of {COMPANY.legal} unless otherwise stated.</p>
      </Section>

      <Section title="Limitation of Liability">
        <p>{COMPANY.legal} shall not be liable for indirect damages, business losses or disputes arising between third parties using the platform.</p>
      </Section>

      <Section title="Modifications">
        <p>We reserve the right to update or modify these terms at any time.</p>
      </Section>

      <Section title="Company Information">
        <p className="font-semibold text-[#0B1F4D]">{COMPANY.legal}</p>
        <p>CIF: {COMPANY.cif}</p>
        <p>Head Office: {COMPANY.address}</p>
        <p>Email: <a href={`mailto:${COMPANY.email}`} className="text-[#2563eb] hover:underline">{COMPANY.email}</a></p>
        <p>Websites: {COMPANY.sites.map((s, i) => <span key={s}>{i > 0 && ' · '}<a href={`https://${s}`} className="text-[#2563eb] hover:underline">{s}</a></span>)}</p>
      </Section>

      <p className="pt-2 border-t border-gray-100 text-gray-500">By using this platform, users agree to these Terms of Service.</p>
    </LegalShell>
  )
}
