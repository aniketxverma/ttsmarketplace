import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'

export const maxDuration = 120

/** Header label → product field, by fuzzy match. First match wins. */
const FIELD_PATTERNS: { field: string; re: RegExp }[] = [
  { field: 'name',              re: /product\s*name|item\s*name|^name$/i },
  { field: 'price_usd',         re: /usd/i },
  { field: 'price_rmb',         re: /rmb|cny|¥/i },
  { field: 'ean',               re: /barcode|ean|upc/i },
  { field: 'color',             re: /colou?r/i },
  { field: 'units_per_carton',  re: /qty\s*\/?\s*ctn|per\s*carton|pcs?\s*\/\s*ctn/i },
  { field: 'carton_dimensions', re: /carton\s*size|carton\s*dimension/i },
  { field: 'weight',            re: /weight/i },
  { field: 'description',       re: /description|specification|specs?/i },
  { field: 'moq',               re: /quantity you need|\bmoq\b|min\.?\s*order/i },
]

function cellText(v: any): string {
  if (v == null) return ''
  if (typeof v === 'object') {
    if (Array.isArray((v as any).richText)) return (v as any).richText.map((r: any) => r.text).join('')
    if ('text' in v) return String((v as any).text)
    if ('result' in v) return String((v as any).result)
    if ('hyperlink' in v) return String((v as any).text ?? (v as any).hyperlink)
    return ''
  }
  return String(v)
}

const toNum = (s: string): number | null => {
  const m = String(s).replace(/[, ]/g, '').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const sheetName = (form.get('sheet') as string | null) || null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 30 MB' }, { status: 400 })

  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any)
  } catch {
    return NextResponse.json({ error: 'Could not read this file. Please upload a valid .xlsx workbook.' }, { status: 400 })
  }

  const sheets = wb.worksheets.map((w) => w.name)
  const ws = (sheetName ? wb.getWorksheet(sheetName) : null) ?? wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: 'The workbook has no sheets', sheets }, { status: 400 })

  // 1) Locate the header row + map columns.
  let headerRowIdx = -1
  const mapping: Record<string, number> = {}
  for (let r = 1; r <= Math.min(25, ws.rowCount); r++) {
    const labels: { col: number; text: string }[] = []
    ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => labels.push({ col, text: cellText(cell.value).trim() }))
    const joined = labels.map((l) => l.text.toLowerCase()).join(' | ')
    if (/product\s*name/.test(joined) && /(price|description|barcode)/.test(joined)) {
      headerRowIdx = r
      for (const { field, re } of FIELD_PATTERNS) {
        if (field in mapping) continue
        const hit = labels.find((l) => re.test(l.text))
        if (hit) mapping[field] = hit.col
      }
      break
    }
  }
  if (headerRowIdx === -1) {
    return NextResponse.json({ error: 'Could not find a header row with a "Product Name" column. Try selecting a different sheet.', sheets }, { status: 422 })
  }

  // 2) Read product rows.
  type Row = { excelRow: number; name: string; price_usd: number | null; price_rmb: number | null; ean: string | null; color: string | null; units_per_carton: number | null; carton_dimensions: string | null; weight_grams: number | null; description: string | null; images: string[] }
  const rows: Row[] = []
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const get = (f: string) => (mapping[f] ? cellText(row.getCell(mapping[f]).value).trim() : '')
    const name = get('name')
    if (!name) continue
    rows.push({
      excelRow: r,
      name,
      price_usd: toNum(get('price_usd')),
      price_rmb: toNum(get('price_rmb')),
      ean: get('ean') || null,
      color: get('color') || null,
      units_per_carton: get('units_per_carton') ? Math.round(toNum(get('units_per_carton')) || 0) || null : null,
      carton_dimensions: get('carton_dimensions') || null,
      weight_grams: get('weight') ? Math.round(toNum(get('weight')) || 0) || null : null,
      description: get('description') || null,
      images: [],
    })
  }
  if (rows.length === 0) return NextResponse.json({ error: 'No product rows found under the header.', sheets }, { status: 422 })

  // 3) Extract embedded images → upload → attach to the nearest product row.
  const admin = createAdminClient()
  const images = (typeof (ws as any).getImages === 'function' ? (ws as any).getImages() : []) as any[]
  for (const img of images) {
    const anchorRow = Math.round((img?.range?.tl?.nativeRow ?? 0)) + 1 // 0-based → 1-based
    // nearest data row at/after the anchor (images sit at the top of a product's tall row)
    let best: Row | null = null
    let bestDist = Infinity
    for (const row of rows) {
      const d = row.excelRow - anchorRow
      const dist = d >= -1 ? d : Infinity // prefer rows at or below the anchor
      if (dist < bestDist) { bestDist = dist; best = row }
    }
    if (!best || bestDist > 6) continue
    const media: any = wb.getImage?.(Number(img.imageId))
    if (!media?.buffer) continue
    const ext = (media.extension || 'png').replace(/[^a-z0-9]/gi, '') || 'png'
    const path = `products/${user.id}/xlsx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await admin.storage.from('brand-assets').upload(path, media.buffer, { contentType: `image/${ext}`, upsert: true })
    if (error) continue
    best.images.push(admin.storage.from('brand-assets').getPublicUrl(path).data.publicUrl)
  }

  return NextResponse.json({
    sheets, sheet: ws.name, headerRow: headerRowIdx,
    detected: Object.keys(mapping),
    count: rows.length,
    rows: rows.map(({ excelRow, ...r }) => r),
  })
}
