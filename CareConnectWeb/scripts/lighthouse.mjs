// npm run lighthouse: builds, serves dist/ and runs Lighthouse on every page.
// HTML reports go to reports/lighthouse/; exits 1 if any accessibility score is under 90.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const PORT = 4180
const PAGES = ['index', 'signin', 'create-account', 'today', 'medications', 'messages', 'schedule', 'symptoms', 'account', '404']
const MIN_A11Y = 90
const OUT = 'reports/lighthouse'
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const run = (args, opts = {}) => execFileSync(npx, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts })

run(['vite', 'build'])
mkdirSync(OUT, { recursive: true })
const server = spawn(npx, ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
})

let failed = false
try {
  await new Promise(r => setTimeout(r, 3000))
  for (const page of PAGES) {
    const base = `${OUT}/${page}`
    run(
      ['lighthouse', `http://127.0.0.1:${PORT}/${page}.html`, '--quiet', '--chrome-flags=--headless=new',
        '--only-categories=accessibility,best-practices,seo,performance', '--output=json', '--output=html', `--output-path=${base}`],
      { stdio: 'ignore' },
    )
    const { categories } = JSON.parse(readFileSync(`${base}.report.json`, 'utf8'))
    // The HTML report embeds the same data, so the JSON isn't kept
    rmSync(`${base}.report.json`)
    const scores = Object.values(categories).map(c => `${c.title} ${Math.round(c.score * 100)}`)
    console.log(`${page.padEnd(16)} ${scores.join('  ')}`)
    if (categories.accessibility.score * 100 < MIN_A11Y) failed = true
  }
} finally {
  // shell: true on Windows means killing the child alone would leave vite running
  if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
  else server.kill()
}
if (failed) {
  console.error(`Accessibility below ${MIN_A11Y} on at least one page`)
  process.exit(1)
}
