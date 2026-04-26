interface ViesResult {
  valid: boolean
  name?: string
  address?: string
}

export async function validateVatNumber(vatNumber: string): Promise<ViesResult> {
  const countryCode = vatNumber.slice(0, 2).toUpperCase()
  const number = vatNumber.slice(2)

  try {
    const res = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${number}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { valid: false }
    const data = await res.json()
    return {
      valid: data.isValid === true,
      name: data.name,
      address: data.address,
    }
  } catch {
    return { valid: false }
  }
}
