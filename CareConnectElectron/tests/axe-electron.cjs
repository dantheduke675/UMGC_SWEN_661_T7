'use strict'

// Runs axe-core inside the real Electron renderer (Chromium layout, real
// colours) on every screen, dialog and panel: in the dark and light themes,
// and in Windows High Contrast (forced colors).
// Usage: npm run test:axe   (exits 1 on any violation or "needs review" item)

const { app, BrowserWindow, Menu } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const SETTLE_MS = 700 // let transitions and entrance animations finish

const PASSES = [
  { name: 'dark', theme: 'dark' },
  { name: 'light', theme: 'light' },
  { name: 'high contrast', theme: 'dark', forcedColors: true }
]

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

// Each step drives the app through its own globals, as a user would reach it
const STEPS = [
  ...['landing', 'signin', 'create', 'biometrics', 'facescan', 'facesuccess'].map(screen => [screen,
    `state.screen = ${JSON.stringify(screen)}; render({ fresh: true })`]),
  ...['today', 'medications', 'messages', 'schedule', 'symptoms', 'account'].map(screen => [screen,
    screen === 'today' ? `state.history = []; go('today', { replace: true })` : `go(${JSON.stringify(screen)})`]),
  ['today + undo toast', `go('today'); document.querySelector('[data-med-take="2"]').click()`],
  ['history panel', `document.querySelector('[data-act="history"]').click()`],
  ['notifications panel', `document.querySelector('[data-act="notes"]').click()`],
  ['SOS dialog', `closePanel(); document.querySelector('[data-act="sos"]').click()`],
  ['symptom dialog', `closeModal(); go('symptoms'); document.querySelector('[data-act="log-symptom"]').click()`],
  ['empty day', `closeModal(); go('schedule'); document.querySelector('[data-day="3"]').click()`],
  ['call', `go('messages'); document.querySelector('[data-call="AJ"]').click()`],
  ['signed out', `stopCall(); hideToast(); signOut()`]
]

// Runs in the page. Both confirmed violations and "needs review" items are
// returned: a review item is one axe could not decide either way.
// axe cannot judge the colour of text cut off at the edge of a scrolling area,
// so contrast items are re-checked once scrolled into view, as a person
// scrolling to them would see them.
//
// Under forced colors axe reads text colour from -webkit-text-fill-color,
// which Chromium reports with the page's own colour even though the system
// colour is what gets painted. Each element's fill is set to its painted
// colour (its computed color), which changes nothing on screen but lets axe
// measure the colours the user actually sees.
const PAGE_AUDIT = `window.__audit = async tags => {
  if (matchMedia('(forced-colors: active)').matches) {
    for (const el of document.querySelectorAll('*')) el.style.setProperty('-webkit-text-fill-color', getComputedStyle(el).color, 'important')
  }
  const rows = r => [...r.violations.map(v => ['violation', v]), ...r.incomplete.map(v => ['needs review', v])]
  const results = rows(await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] }))
  for (const [kind, v] of results) {
    if (kind !== 'needs review' || v.id !== 'color-contrast') continue
    const kept = []
    for (const n of v.nodes) {
      const el = document.querySelector(n.target.join(' '))
      if (!el) { kept.push(n); continue }
      const scrolls = [...document.querySelectorAll('*')].filter(x => x.scrollTop).map(x => [x, x.scrollTop])
      el.scrollIntoView({ block: 'center', behavior: 'instant' })
      const again = await axe.run(el, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations', 'incomplete'] })
      for (const x of document.querySelectorAll('*')) if (x.scrollTop) x.scrollTop = 0
      for (const [x, top] of scrolls) x.scrollTop = top
      const target = n.target.join(' ')
      const left = rows(again).flatMap(([, w]) => w.nodes).filter(m => m.target.join(' ') === target)
      if (left.length) kept.push(n)
    }
    v.nodes = kept
  }
  return results.filter(([, v]) => v.nodes.length).map(([kind, v]) => ({ kind, id: v.id, impact: v.impact, help: v.help,
    nodes: v.nodes.map(n => ({ target: n.target.join(' '),
      summary: n.failureSummary || [...n.any, ...n.all, ...n.none].map(c => c.message).join('; ') })) }))
}`

async function audit(win, label) {
  const result = await win.webContents.executeJavaScript(`__audit(${JSON.stringify(TAGS)})`)
  for (const v of result) {
    console.log(`\n[${label}] ${v.kind}: ${v.impact} ${v.id}: ${v.help}`)
    for (const n of v.nodes) console.log(`   ${n.target}\n      ${n.summary.replace(/\n/g, '\n      ')}`)
  }
  return result.length
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  const win = new BrowserWindow({
    width: 1440, height: 900, show: false,
    webPreferences: { preload: path.join(ROOT, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
  // The DevTools protocol answers only once the window has a page
  await win.loadFile(path.join(ROOT, 'src', 'index.html'))
  win.webContents.debugger.attach()
  let failures = 0, checked = 0
  for (const pass of PASSES) {
    // Forced colors as Windows High Contrast applies them: Chromium swaps in
    // the system palette, the same as the real setting
    await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: pass.forcedColors ? 'active' : 'none' }]
    })
    // A fresh page per pass, so each pass starts from the same app state
    await win.loadFile(path.join(ROOT, 'src', 'index.html'))
    await win.webContents.executeJavaScript(AXE_SOURCE)
    await win.webContents.executeJavaScript(PAGE_AUDIT + "; null")
    await win.webContents.executeJavaScript(`state.theme = '${pass.theme}'; applyTheme()`)
    if (pass.forcedColors) {
      if (!await win.webContents.executeJavaScript(`matchMedia('(forced-colors: active)').matches`)) {
        throw new Error('forced colors did not turn on')
      }
    }
    for (const [view, script] of STEPS) {
      const error = await win.webContents.executeJavaScript(`try { ${script}; null } catch (e) { String(e) }`)
      if (error) throw new Error(`${pass.name} / ${view}: ${error}`)
      await wait(SETTLE_MS)
      failures += await audit(win, `${pass.name} / ${view}`)
      checked++
    }
  }
  console.log(`\naxe: ${checked} views checked, ${failures} issue(s) found`)
  app.exit(failures ? 1 : 0)
}).catch(err => { console.error(err); app.exit(2) })
