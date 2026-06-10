import { LegalShell, Section, COMPANY } from '@/components/legal/LegalShell'

export const metadata = { title: 'Privacy Policy · TTAI EMA', description: 'How TTAI EMA collects, uses and protects your personal data.' }

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" subtitle="How we collect, use and protect your personal data." updated="June 2026">
      <p>{COMPANY.legal} (&ldquo;TTAI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the TTAI and TTAIEMA platforms. This policy explains what personal data we process and your rights under the EU General Data Protection Regulation (GDPR).</p>

      <Section title="Data We Collect">
        <p>We collect information you provide when registering an account or using the platform, including your name, business details, email address, phone number, billing and shipping information, and the content of orders, messages and offers you create.</p>
      </Section>

      <Section title="How We Use Your Data">
        <ul className="list-disc pl-5 space-y-1">
          <li>To create and manage your account.</li>
          <li>To process orders, payments and dropshipping between buyers, suppliers and sales points.</li>
          <li>To connect suppliers and buyers and facilitate business matchmaking.</li>
          <li>To send service communications, offers and platform updates you opt into.</li>
          <li>To comply with legal and tax obligations.</li>
        </ul>
      </Section>

      <Section title="Sharing">
        <p>To fulfil orders we share the data necessary to complete a transaction with the relevant supplier, sales point or logistics partner. We use trusted processors (such as payment and email providers) who act on our instructions. We do not sell your personal data.</p>
      </Section>

      <Section title="Cookies">
        <p>We use essential cookies to keep you signed in and remember your language and region preferences, and analytics cookies to improve the platform.</p>
      </Section>

      <Section title="Data Retention">
        <p>We retain personal data for as long as your account is active and as required to meet legal, accounting and reporting obligations.</p>
      </Section>

      <Section title="Your Rights">
        <p>You have the right to access, correct, delete, restrict or port your personal data, and to object to certain processing. To exercise these rights, contact us at <a href={`mailto:${COMPANY.email}`} className="text-[#2563eb] hover:underline">{COMPANY.email}</a>.</p>
      </Section>

      <Section title="Data Controller">
        <p className="font-semibold text-[#0B1F4D]">{COMPANY.legal}</p>
        <p>CIF: {COMPANY.cif}</p>
        <p>{COMPANY.address}</p>
        <p>Email: <a href={`mailto:${COMPANY.email}`} className="text-[#2563eb] hover:underline">{COMPANY.email}</a></p>
      </Section>
    </LegalShell>
  )
}
