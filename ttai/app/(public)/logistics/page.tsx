import { DepartmentLanding } from '@/components/shared/DepartmentLanding'
import { Ship, Plane, Truck, Warehouse, ShieldCheck, FileCheck, Boxes, Container } from 'lucide-react'

export const metadata = {
  title: 'TTAI Logistics Hub · Shipping, Warehousing & Import/Export',
  description: 'Sea, air and road freight, warehousing, inspection, customs and container consolidation across Europe, the Middle East and Africa.',
}

export default function LogisticsPage() {
  return (
    <DepartmentLanding
      department="logistics"
      kicker="TTAI Logistics Hub"
      title="Move your goods anywhere — we handle the logistics."
      subtitle="Sea, air and road freight, warehousing, inspection and customs across Europe, the Middle East and Africa — coordinated by one team, tracked in one place."
      heroBlurb="Sourcing on TTAI is only half the journey. Our Logistics Hub takes care of getting your goods from the supplier's warehouse to your door — consolidating containers, inspecting quality before shipment, clearing customs and arranging the fastest route. One request, one point of contact, full visibility."
      services={[
        { icon: <Ship className="w-5 h-5" />,        title: 'Sea Freight (FCL / LCL)',  desc: 'Full- and less-than-container loads on the main EMEA trade lanes at consolidated rates.' },
        { icon: <Plane className="w-5 h-5" />,       title: 'Air Freight',              desc: 'Express and standard air cargo when speed matters most.' },
        { icon: <Truck className="w-5 h-5" />,       title: 'Road & Last-Mile',         desc: 'Cross-border trucking and final delivery across Europe, the Gulf and North Africa.' },
        { icon: <Warehouse className="w-5 h-5" />,   title: 'Warehousing & Fulfilment', desc: 'Short- and long-term storage, pick-and-pack and order fulfilment from our hubs.' },
        { icon: <ShieldCheck className="w-5 h-5" />, title: 'Inspection & QC',          desc: 'Pre-shipment quality control and factory audits so you only pay for what you approve.' },
        { icon: <FileCheck className="w-5 h-5" />,   title: 'Customs & Import/Export',  desc: 'Documentation, duties and clearance handled end-to-end on both sides.' },
        { icon: <Boxes className="w-5 h-5" />,       title: 'Container Consolidation',  desc: 'Combine orders from several suppliers into one cost-efficient shipment.' },
        { icon: <Container className="w-5 h-5" />,   title: 'Door-to-Door',             desc: 'A single quote from supplier warehouse to your final address.' },
      ]}
      steps={[
        { title: 'Tell us your shipment', desc: 'Origin, destination, goods and timeline — send it below.' },
        { title: 'Get a quote',           desc: 'Eva prepares the best route and a transparent all-in price.' },
        { title: 'We move & inspect',     desc: 'Pickup, QC, consolidation and customs — all handled for you.' },
        { title: 'Track to delivery',     desc: 'Stay updated until your goods arrive safely.' },
      ]}
      formTitle="Request a logistics quote"
      sourceForm="logistics-landing"
    />
  )
}
