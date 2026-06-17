import { DepartmentLanding } from '@/components/shared/DepartmentLanding'
import { Target, Handshake, TrendingUp, Building2, Search, LineChart, Users, Lightbulb } from 'lucide-react'

export const metadata = {
  title: 'TTAI Business Consulting · Market Entry, Investors & Strategy',
  description: 'Market entry, investor and partnership matching, sourcing projects, company setup and growth strategy across Europe, the Middle East and Africa.',
}

export default function ConsultingPage() {
  return (
    <DepartmentLanding
      department="consulting"
      kicker="TTAI Business Consulting"
      title="Grow into new markets with a partner on the ground."
      subtitle="Market entry, investor and partnership matching, sourcing projects and company setup across Europe, the Middle East and Africa — guided by people who know the terrain."
      heroBlurb="Trade opens doors; strategy walks you through them. Our Consulting team helps you enter new markets, find the right partners and investors, structure sourcing projects and set up locally — turning a one-off deal into lasting growth. Tell us your goal and we'll map the route."
      services={[
        { icon: <Target className="w-5 h-5" />,     title: 'Market Entry',             desc: 'Assess demand, regulations and the best go-to-market path for a new region.' },
        { icon: <Handshake className="w-5 h-5" />,  title: 'Partnership Matching',     desc: 'Connect with distributors, agents and local partners that fit your business.' },
        { icon: <TrendingUp className="w-5 h-5" />, title: 'Investor Introductions',   desc: 'Get in front of investors and funds active in your sector and region.' },
        { icon: <Search className="w-5 h-5" />,     title: 'Sourcing Projects',        desc: 'Dedicated sourcing for large or recurring orders, end to end.' },
        { icon: <Building2 className="w-5 h-5" />,  title: 'Company Setup',            desc: 'Local entity formation, licensing and compliance handled for you.' },
        { icon: <LineChart className="w-5 h-5" />,  title: 'Growth Strategy',          desc: 'Pricing, positioning and expansion planning built around your numbers.' },
        { icon: <Users className="w-5 h-5" />,      title: 'Franchise & Networks',     desc: 'Build or join franchise and reseller networks across EMEA.' },
        { icon: <Lightbulb className="w-5 h-5" />,  title: 'Advisory & Market Reports',desc: 'On-demand insight and reports to back your next decision.' },
      ]}
      steps={[
        { title: 'Share your goal',   desc: 'Where you are and where you want to grow — send it below.' },
        { title: 'Discovery call',    desc: 'Zain reviews your case and aligns on objectives.' },
        { title: 'Tailored plan',     desc: 'A clear roadmap with partners, costs and milestones.' },
        { title: 'Execute together',  desc: 'We stay alongside you through delivery and growth.' },
      ]}
      formTitle="Book a consultation"
      sourceForm="consulting-landing"
    />
  )
}
