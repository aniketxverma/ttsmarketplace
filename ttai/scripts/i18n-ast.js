// AST-based i18n wrapper. Uses the TypeScript parser to wrap ONLY real JSX text
// nodes + placeholder="" attributes in tt() — never touches generics, arrow
// functions, or any code. Injects the localizeUI() setup. Server components only.
//   FILE=app/(public)/about/page.tsx node scripts/i18n-ast.js
const ts = require('typescript')
const fs = require('fs')
const FILE = process.env.FILE
let src = fs.readFileSync(FILE, 'utf8')

if (/^\s*['"]use client['"]/m.test(src)) { console.log('SKIP client:', FILE); process.exit(0) }
if (/localizeUI/.test(src)) { console.log('SKIP wired:', FILE); process.exit(0) }

const UI = (t) => {
  const x = t.trim()
  if (x.length < 3 || x.length > 80) return false
  if (!/^[A-Za-z]/.test(x)) return false             // start with a letter
  if (!/[a-z]/.test(x)) return false                 // has a lowercase letter
  if (/[{}<>=_·|]|&[a-z]+;/.test(x)) return false     // no code/entities
  if (/^(https?:|\/|#|www\.)/.test(x)) return false
  if (/[:;]\s/.test(x) && /\b(any|string|number|boolean|Promise|Record|void)\b/.test(x)) return false
  return true
}

const sf = ts.createSourceFile(FILE, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const edits = []      // { start, end, text }
const strings = new Set()

// Only wrap JSX inside the default-export page component — module-level helper
// sub-components don't have `tt` in scope (and we inject tt only into the page fn).
let mainFn = null
function findMain(node) {
  if (ts.isFunctionDeclaration(node) && node.modifiers &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) { mainFn = node }
  ts.forEachChild(node, findMain)
}
findMain(sf)
if (!mainFn || !mainFn.body) { console.log('WARN no default-export fn:', FILE); process.exit(0) }

function visit(node) {
  if (ts.isJsxText(node)) {
    const full = node.getText(sf)
    const core = full.trim()
    if (core && UI(core)) {
      const lead = (full.match(/^\s*/) || [''])[0]
      const trail = (full.match(/\s*$/) || [''])[0]
      strings.add(core)
      edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${lead}{tt(${JSON.stringify(core)})}${trail}` })
    }
  } else if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'placeholder' &&
             node.initializer && ts.isStringLiteral(node.initializer)) {
    const v = node.initializer.text
    if (UI(v)) {
      strings.add(v)
      edits.push({ start: node.initializer.getStart(sf), end: node.initializer.getEnd(), text: `{tt(${JSON.stringify(v)})}` })
    }
  }
  ts.forEachChild(node, visit)
}
visit(mainFn.body)

if (!strings.size) { console.log('NO STRINGS:', FILE); process.exit(0) }

// Inject the tt setup at the TOP of the page function body (guaranteed top-level
// scope — never inside a nested try/if/map block) using the AST position.
const ttBlock = `\n  const tt = await localizeUI([${[...strings].map((x) => JSON.stringify(x)).join(', ')}], getLocale())\n  `
const bodyStart = mainFn.body.statements.length ? mainFn.body.statements[0].getStart(sf) : mainFn.body.getStart(sf) + 1
edits.push({ start: bodyStart, end: bodyStart, text: ttBlock })

// Ensure the page function is async (needed for `await localizeUI`).
const isAsync = mainFn.modifiers && mainFn.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
if (!isAsync) {
  const fnKw = src.indexOf('function', mainFn.getStart(sf))
  edits.push({ start: fnKw, end: fnKw, text: 'async ' })
}

// Apply text edits from end → start so offsets stay valid.
edits.sort((a, b) => b.start - a.start)
let out = src
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end)

// Inject imports right after the first import line (handles import at offset 0).
// Detect existing imports from the ORIGINAL src (out already contains the injected
// localizeUI(...) call, which would false-positive a presence check).
const hasGetLocale = /import \{[^}]*getLocale[^}]*\} from '@\/lib\/i18n\/server'/.test(src)
const hasLocalizeUI = /import \{[^}]*localizeUI[^}]*\} from '@\/lib\/i18n\/ui'/.test(src)
let imp = ''
if (!hasGetLocale) imp += `import { getLocale } from '@/lib/i18n/server'\n`
if (!hasLocalizeUI) imp += `import { localizeUI } from '@/lib/i18n/ui'\n`
if (imp) out = out.replace(/^(import [^\n]+\n)/m, `$1${imp}`)

fs.writeFileSync(FILE, out)
fs.appendFileSync(process.env.STROUT || 'C:/Users/anike/AppData/Local/Temp/claude/admin-strings.json.lines', [...strings].map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log('WRAPPED', strings.size, ':', FILE)
