// AST-based i18n wrapper for CLIENT components. Wraps real JSX text + placeholder=""
// in t() (the useT() hook), injects `const t = useT()` at the top of the component.
// Strings must be added to es.ts as top-level keys (see scripts/strings-to-es.js).
//   FILE=app/(public)/checkout/page.tsx node scripts/i18n-ast-client.js
const ts = require('typescript')
const fs = require('fs')
const FILE = process.env.FILE
let src = fs.readFileSync(FILE, 'utf8')

if (!/^\s*['"]use client['"]/m.test(src)) { console.log('SKIP not-client:', FILE); process.exit(0) }
if (/useT\(/.test(src)) { console.log('SKIP wired:', FILE); process.exit(0) }

const UI = (t) => {
  const x = t.trim()
  if (x.length < 3 || x.length > 90) return false
  if (!/^[A-Za-z]/.test(x)) return false
  if (!/[a-z]/.test(x)) return false
  if (/[{}<>=_·|]|&[a-z]+;/.test(x)) return false
  if (/^(https?:|\/|#|www\.)/.test(x)) return false
  return true
}

const sf = ts.createSourceFile(FILE, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

let mainFn = null
function findMain(node) {
  if (ts.isFunctionDeclaration(node) && node.modifiers &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) { mainFn = node }
  ts.forEachChild(node, findMain)
}
findMain(sf)
if (!mainFn || !mainFn.body) { console.log('WARN no default-export fn:', FILE); process.exit(0) }

const edits = []
const strings = new Set()
function visit(node) {
  if (ts.isJsxText(node)) {
    const full = node.getText(sf)
    const core = full.trim()
    if (core && UI(core)) {
      const lead = (full.match(/^\s*/) || [''])[0]
      const trail = (full.match(/\s*$/) || [''])[0]
      strings.add(core)
      edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${lead}{t(${JSON.stringify(core)})}${trail}` })
    }
  } else if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'placeholder' &&
             node.initializer && ts.isStringLiteral(node.initializer)) {
    const v = node.initializer.text
    if (UI(v)) { strings.add(v); edits.push({ start: node.initializer.getStart(sf), end: node.initializer.getEnd(), text: `{t(${JSON.stringify(v)})}` }) }
  }
  ts.forEachChild(node, visit)
}
visit(mainFn.body)
if (!strings.size) { console.log('NO STRINGS:', FILE); process.exit(0) }

// Inject `const t = useT()` at the top of the component body (React hook — top level).
const bodyStart = mainFn.body.statements.length ? mainFn.body.statements[0].getStart(sf) : mainFn.body.getStart(sf) + 1
edits.push({ start: bodyStart, end: bodyStart, text: `const t = useT()\n  ` })

edits.sort((a, b) => b.start - a.start)
let out = src
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end)

if (!/import \{[^}]*useT[^}]*\} from '@\/lib\/i18n\/client'/.test(src)) {
  out = out.replace(/^(import [^\n]+\n)/m, `$1import { useT } from '@/lib/i18n/client'\n`)
}

fs.writeFileSync(FILE, out)
fs.appendFileSync(process.env.STROUT || 'C:/Users/anike/AppData/Local/Temp/claude/client-strings.json.lines', [...strings].map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log('WRAPPED', strings.size, ':', FILE)
