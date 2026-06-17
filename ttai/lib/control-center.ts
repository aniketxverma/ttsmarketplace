// ─────────────────────────────────────────────────────────────────────────────
// TTAIEMA Control Center — shared config for the 3 departments + their managers.
// Single source of truth used by the ticket endpoint, the public form and the
// admin Control Center. To re-assign a manager, edit MANAGER below.
// ─────────────────────────────────────────────────────────────────────────────

export type Department = 'marketplace' | 'logistics' | 'consulting'
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'closed'

export const DEPARTMENTS: {
  key: Department
  label: string
  manager: string
  blurb: string
  email?: string
}[] = [
  {
    key: 'marketplace',
    label: 'TTAI Marketplace',
    manager: 'Ane',
    blurb: 'Suppliers, products, shops, orders and B2B sales.',
  },
  {
    key: 'logistics',
    label: 'TTAI Logistics Hub',
    manager: 'Eva',
    blurb: 'Shipping, warehouse, inspection, containers, import/export and logistics quotes.',
  },
  {
    key: 'consulting',
    label: 'TTAI Business Consulting',
    manager: 'Zain',
    blurb: 'Consulting, projects, investors, partnerships and business strategy.',
  },
]

export const MANAGERS = ['Ane', 'Eva', 'Zain'] as const

export function departmentInfo(key?: string | null) {
  return DEPARTMENTS.find((d) => d.key === key) ?? DEPARTMENTS[0]
}

export function defaultAssignee(department?: string | null): string {
  return departmentInfo(department).manager
}

export const STATUSES: { key: TicketStatus; label: string; color: string }[] = [
  { key: 'new',         label: 'New',         color: 'bg-blue-100 text-blue-700' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  { key: 'waiting',     label: 'Waiting',     color: 'bg-purple-100 text-purple-700' },
  { key: 'closed',      label: 'Closed',      color: 'bg-gray-200 text-gray-600' },
]

export function statusInfo(key?: string | null) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0]
}
