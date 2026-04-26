interface FeeInput {
  grossCents: number
  ttaiCommissionPct: number
  ttaiFixedCents: number
  brokerSharePct: number
  vatCents: number
}

export interface FeeSplit {
  grossCents: number
  ttaiCommissionCents: number
  ttaiFixedCents: number
  brokerNetCents: number
  supplierNetCents: number
  vatCollectedCents: number
}

export function calculateFeeSplit(input: FeeInput): FeeSplit {
  const { grossCents, ttaiCommissionPct, ttaiFixedCents, brokerSharePct, vatCents } = input

  const netBeforeVat = grossCents - vatCents
  const ttaiCommissionCents = Math.round(netBeforeVat * (ttaiCommissionPct / 100))
  const afterTtai = netBeforeVat - ttaiCommissionCents - ttaiFixedCents
  const brokerNetCents = Math.round(afterTtai * (brokerSharePct / 100))
  const supplierNetCents = afterTtai - brokerNetCents

  return {
    grossCents,
    ttaiCommissionCents,
    ttaiFixedCents,
    brokerNetCents,
    supplierNetCents,
    vatCollectedCents: vatCents,
  }
}
