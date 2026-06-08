import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

export const maxDuration = 120

/**
 * Extract "Place in Cell" images (Excel rich-data / cell images). exceljs only
 * reads floating drawing images, so these are parsed straight from the xlsx zip.
 * Each maps to an exact cell → row. Chain:
 *   cell.vm → valueMetadata bk → futureMetadata(XLRICHVALUE) rvb.i → rich value
 *           → richValueRel → relationship → xl/media/imageN
 */
async function extractInCellImages(zipBuf: Buffer, sheetName: string): Promise<{ row: number; buffer: Buffer; ext: string }[]> {
  let zip: JSZip
  try { zip = await JSZip.loadAsync(zipBuf) } catch { return [] }
  const read = async (p: string) => { const f = zip.file(p); return f ? await f.async('string') : null }
  const strip = (t: string) => 'xl/' + t.replace(/^(\.\.\/)+/, '')

  const relsXml = await read('xl/richData/_rels/richValueRel.xml.rels')
  if (!relsXml) return [] // no rich-data images in this workbook

  const rIdToMedia: Record<string, string> = {}
  for (const m of Array.from(relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g))) rIdToMedia[m[1]] = strip(m[2])

  const rvrXml = (await read('xl/richData/richValueRel.xml')) ?? ''
  const relIndexToRId = Array.from(rvrXml.matchAll(/r:id="(rId\d+)"/g)).map((m) => m[1])

  const rvXml = (await read('xl/richData/rdrichvalue.xml')) ?? ''
  const rvToRelIndex = (rvXml.match(/<rv\b[\s\S]*?<\/rv>/g) || []).map((rv) => {
    const v = Array.from(rv.matchAll(/<v>([^<]*)<\/v>/g)).map((x) => parseInt(x[1], 10)).find((n) => !isNaN(n))
    return v ?? 0
  })

  const metaXml = (await read('xl/metadata.xml')) ?? ''
  const fmBlock = metaXml.match(/<futureMetadata[^>]*XLRICHVALUE[\s\S]*?<\/futureMetadata>/)?.[0] ?? ''
  const fmToRv = (fmBlock.match(/<bk>[\s\S]*?<\/bk>/g) || []).map((bk) => {
    const i = bk.match(/rvb\s+i="(\d+)"/); return i ? parseInt(i[1], 10) : 0
  })
  const vmBlock = metaXml.match(/<valueMetadata[\s\S]*?<\/valueMetadata>/)?.[0] ?? ''
  const vmToFm = (vmBlock.match(/<bk>[\s\S]*?<\/bk>/g) || []).map((bk) => {
    const v = bk.match(/<rc[^>]*\sv="(\d+)"/); return v ? parseInt(v[1], 10) : 0
  })

  // locate this sheet's xml path via workbook rels
  const wbXml = (await read('xl/workbook.xml')) ?? ''
  const wbRels = (await read('xl/_rels/workbook.xml.rels')) ?? ''
  const ridToTarget: Record<string, string> = {}
  for (const m of Array.from(wbRels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g))) ridToTarget[m[1]] = m[2]
  let sheetPath = ''
  for (const m of Array.from(wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g))) {
    if (m[1] === sheetName) { sheetPath = strip(ridToTarget[m[2]] || ''); break }
  }
  if (!sheetPath) {
    const first = Object.values(ridToTarget).find((t) => /worksheets\/sheet/i.test(t))
    sheetPath = first ? strip(first) : 'xl/worksheets/sheet1.xml'
  }
  const sheetXml = (await read(sheetPath)) ?? ''

  const out: { row: number; buffer: Buffer; ext: string }[] = []
  for (const m of Array.from(sheetXml.matchAll(/<c\s+r="[A-Z]+(\d+)"[^>]*\bvm="(\d+)"/g))) {
    const row = parseInt(m[1], 10)
    const vm = parseInt(m[2], 10)
    const rId = relIndexToRId[rvToRelIndex[fmToRv[vmToFm[vm - 1] ?? 0] ?? 0] ?? 0]
    const mediaPath = rId ? rIdToMedia[rId] : undefined
    const f = mediaPath ? zip.file(mediaPath) : null
    if (!f) continue
    out.push({ row, buffer: await f.async('nodebuffer'), ext: (mediaPath!.split('.').pop() || 'png').toLowerCase() })
  }
  return out
}

/** Header label → product field, by fuzzy match. First match wins. */
const FIELD_PATTERNS: { field: string; re: RegExp }[] = [
  { field: 'name',              re: /product\s*name|item\s*name|^name$|model|title/i },
  { field: 'brand',             re: /brand|marca|make|manufacturer/i },
  { field: 'price',             re: /price|cost|exw|\bfob\b|usd|eur|rmb|cny/i },
  { field: 'ean',               re: /barcode|ean|upc|gtin/i },
  { field: 'color',             re: /colou?r/i },
  { field: 'units_per_carton',  re: /qty\s*\/?\s*ctn|per\s*carton|pcs?\s*\/\s*ctn|units?\s*\/?\s*(box|carton)/i },
  { field: 'carton_dimensions', re: /carton\s*size|carton\s*dimension|box\s*size/i },
  { field: 'weight',            re: /weight/i },
  { field: 'description',       re: /description|specification|specs?/i },
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

  // The browser uploads the .xlsx straight to storage (signed URL); we read it
  // back here so there is no API request-body size limit.
  const { storagePath, sheet: sheetName } = await req.json().catch(() => ({})) as { storagePath?: string; sheet?: string }
  if (!storagePath || !storagePath.startsWith(`imports/${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid or missing file reference' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: blob, error: dlErr } = await admin.storage.from('brand-assets').download(storagePath)
  if (dlErr || !blob) return NextResponse.json({ error: 'Could not read the uploaded file from storage' }, { status: 400 })

  const fileBuf = Buffer.from(await blob.arrayBuffer())
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(fileBuf as any)
  } catch {
    return NextResponse.json({ error: 'Could not read this file. Please upload a valid .xlsx workbook.' }, { status: 400 })
  }

  const sheets = wb.worksheets.map((w) => w.name)
  const ws = (sheetName ? wb.getWorksheet(sheetName) : null) ?? wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: 'The workbook has no sheets', sheets }, { status: 400 })

  // 1) Pick the header row leniently (never fails). Score by how many text
  //    cells it has + a bonus for common header keywords.
  const HEADER_KW = /name|product|item|price|cost|description|spec|qty|quantity|barcode|ean|sku|code|colou?r|weight|carton|box|pallet|model|unit/i
  const maxCol = Math.min(40, ws.columnCount || 40)
  const rowLabels = (r: number) => {
    const out: string[] = []
    for (let c = 1; c <= maxCol; c++) out[c] = cellText(ws.getRow(r).getCell(c).value).trim()
    return out
  }
  let headerRowIdx = 1, bestScore = -1
  for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
    const labels = rowLabels(r)
    let textCnt = 0, kwCnt = 0
    for (let c = 1; c <= maxCol; c++) {
      const t = labels[c]; if (!t) continue
      if (isNaN(Number(t))) textCnt++
      if (HEADER_KW.test(t)) kwCnt++
    }
    const score = textCnt + kwCnt * 3
    if (score > bestScore) { bestScore = score; headerRowIdx = r }
  }
  const header = rowLabels(headerRowIdx)

  // 2) Auto-map fields → column index (best guess; user can override in the UI).
  const autoMap: Record<string, number> = {}
  for (const { field, re } of FIELD_PATTERNS) {
    for (let c = 1; c <= maxCol; c++) {
      if (header[c] && re.test(header[c])) { autoMap[field] = c; break }
    }
  }

  // 3) Columns (header + sample values) for the mapping UI.
  const sampleRows: number[] = []
  for (let r = headerRowIdx + 1; r <= ws.rowCount && sampleRows.length < 4; r++) {
    const any = rowLabels(r).some((t) => t)
    if (any) sampleRows.push(r)
  }
  const columns = [] as { index: number; header: string; samples: string[] }[]
  for (let c = 1; c <= maxCol; c++) {
    const samples = sampleRows.map((r) => cellText(ws.getRow(r).getCell(c).value).trim()).filter(Boolean).slice(0, 3)
    if (header[c] || samples.length) columns.push({ index: c, header: header[c] || '', samples })
  }

  // 4) Raw rows — every column's value per row, so the client can apply any mapping.
  type RawRow = { excelRow: number; cells: Record<number, string>; images: string[] }
  const rows: RawRow[] = []
  const rowByExcel = new Map<number, RawRow>()
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
    const cells: Record<number, string> = {}
    let any = false
    for (let c = 1; c <= maxCol; c++) {
      const t = cellText(ws.getRow(r).getCell(c).value).trim()
      if (t) { cells[c] = t; any = true }
    }
    if (!any) continue
    const rr: RawRow = { excelRow: r, cells, images: [] }
    rows.push(rr); rowByExcel.set(r, rr)
  }

  // Upload one image buffer to storage and attach its public URL to a row.
  async function uploadImg(buffer: Buffer, extRaw: string, target: RawRow) {
    const ext = (extRaw || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png'
    const path = `products/${user!.id}/xlsx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await admin.storage.from('brand-assets')
      .upload(path, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true })
    if (error) return
    target.images.push(admin.storage.from('brand-assets').getPublicUrl(path).data.publicUrl)
  }

  // 5) Floating images → nearest row at/after the anchor.
  const images = (typeof (ws as any).getImages === 'function' ? (ws as any).getImages() : []) as any[]
  for (const img of images) {
    const anchorRow = Math.round((img?.range?.tl?.nativeRow ?? 0)) + 1
    let best: RawRow | null = null, bestDist = Infinity
    for (const row of rows) {
      const d = row.excelRow - anchorRow
      const dist = d >= -1 ? d : Infinity
      if (dist < bestDist) { bestDist = dist; best = row }
    }
    if (!best || bestDist > 6) continue
    const media: any = wb.getImage?.(Number(img.imageId))
    if (media?.buffer) await uploadImg(media.buffer, media.extension || 'png', best)
  }

  // 5b) "Place in Cell" (rich-data) images → exact row.
  try {
    for (const im of await extractInCellImages(fileBuf, ws.name)) {
      const target = rowByExcel.get(im.row)
      if (target) await uploadImg(im.buffer, im.ext, target)
    }
  } catch { /* best effort */ }

  return NextResponse.json({
    sheets, sheet: ws.name, headerRow: headerRowIdx,
    columns, autoMap, count: rows.length,
    rows: rows.map(({ excelRow, ...r }) => r),
  })
}
