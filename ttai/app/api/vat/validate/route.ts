import { NextRequest, NextResponse } from 'next/server'
import { validateVatNumber } from '@/lib/vat/vies'

export async function POST(req: NextRequest) {
  const { vat_number } = await req.json()
  if (!vat_number || typeof vat_number !== 'string' || vat_number.length < 4) {
    return NextResponse.json({ error: 'Invalid VAT number format' }, { status: 400 })
  }

  const result = await validateVatNumber(vat_number.trim().toUpperCase())
  return NextResponse.json(result)
}
