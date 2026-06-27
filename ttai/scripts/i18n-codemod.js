// Wrap a server-component page's JSX text nodes + placeholders in tt(), inject a
// localizeUI() setup, and report the strings (to be warm-translated). Conservative:
// only touches plain JSX text and placeholder="" — never module-level data arrays.
//   FILE=app/(dashboard)/admin/users/page.tsx node scripts/i18n-codemod.js
const fs = require('fs')
const FILE = process.env.FILE
let s = fs.readFileSync(FILE, 'utf8')

if (/^['"]use client['"]/m.test(s)) { console.log('SKIP (client component):', FILE); process.exit(0) }
if (/localizeUI/.test(s)) { console.log('SKIP (already wired):', FILE); process.exit(0) }

const UI = (t) => {
  const x = t.trim()
  if (x.length < 3 || x.length > 70) return false
  if (!/^[A-Za-z(]/.test(x)) return false           // starts with a letter (or paren)
  if (!/[a-z]/.test(x)) return false                 // has a lowercase letter (skips ALLCAPS codes)
  if (/[{}<>=_·]|&[a-z]+;/.test(x)) return false     // no code/JSX fragments, snake_case, or HTML entities
  if (/^(https?:|\/|#|www\.)/.test(x)) return false  // no urls/paths
  return true
}

const strings = new Set()
// JSX text nodes:  >Some Text<  — preserve surrounding whitespace
s = s.replace(/>([^<>{}\n]+)</g, (m, inner) => {
  const lead = (inner.match(/^\s*/) || [''])[0]
  const trail = (inner.match(/\s*$/) || [''])[0]
  const core = inner.trim()
  if (!UI(core)) return m
  strings.add(core)
  return `>${lead}{tt(${JSON.stringify(core)})}${trail}<`
})
// placeholder="Some text"
s = s.replace(/placeholder="([^"]+)"/g, (m, txt) => {
  if (!UI(txt)) return m
  strings.add(txt.trim())
  return `placeholder={tt(${JSON.stringify(txt.trim())})}`
})

if (!strings.size) { console.log('NO STRINGS:', FILE); process.exit(0) }

// Inject imports (after the last existing import line)
if (!/from '@\/lib\/i18n\/server'/.test(s)) {
  s = s.replace(/(\nimport [^\n]+\n)(?![\s\S]*\nimport )/, `$1import { getLocale } from '@/lib/i18n/server'\nimport { localizeUI } from '@/lib/i18n/ui'\n`)
} else if (!/getLocale/.test(s)) {
  s = s.replace(/from '@\/lib\/i18n\/server'/, (m) => m) // getLocale missing but server imported — add localizeUI only
  s = s.replace(/(\nimport [^\n]+\n)(?![\s\S]*\nimport )/, `$1import { getLocale } from '@/lib/i18n/server'\nimport { localizeUI } from '@/lib/i18n/ui'\n`)
} else if (!/localizeUI/.test(s)) {
  s = s.replace(/(\nimport [^\n]+\n)(?![\s\S]*\nimport )/, `$1import { localizeUI } from '@/lib/i18n/ui'\n`)
}

// Inject the tt setup after the first reliable anchor in the component body.
const ttBlock = `\n  const tt = await localizeUI([${[...strings].map((x) => JSON.stringify(x)).join(', ')}], getLocale())`
if (/await requireRole\([^)]*\)\s*\n/.test(s)) {
  s = s.replace(/(await requireRole\([^)]*\)\s*\n)/, `$1${ttBlock}\n`)
} else if (/const \w+ = createAdminClient\(\)\s*\n/.test(s)) {
  s = s.replace(/(const \w+ = createAdminClient\(\)\s*\n)/, `$1${ttBlock}\n`)
} else if (/const \w+ = await createClient\(\)\s*\n/.test(s)) {
  s = s.replace(/(const \w+ = await createClient\(\)\s*\n)/, `$1${ttBlock}\n`)
} else if (/const \w+ = createClient\(\)\s*\n/.test(s)) {
  s = s.replace(/(const \w+ = createClient\(\)\s*\n)/, `$1${ttBlock}\n`)
} else if (/export default (async )?function \w+\(\)\s*\{\s*\n/.test(s)) {
  // Static page (no data fetch): force async + inject at the top of the body.
  s = s.replace(/export default (async )?function (\w+)\(\)\s*\{\s*\n/, `export default async function $2() {${ttBlock}\n`)
} else {
  console.log('WARN no anchor for tt in', FILE, '— skipping injection')
  process.exit(0)
}

fs.writeFileSync(FILE, s)
fs.appendFileSync(process.env.STROUT || 'C:/Users/anike/AppData/Local/Temp/claude/admin-strings.json.lines', [...strings].map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log('WRAPPED', strings.size, 'strings:', FILE)
