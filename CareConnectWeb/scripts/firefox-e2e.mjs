// npm run test:e2e:firefox: builds, serves dist/ and runs the 49 desktop e2e tests (e2e/a11y, auth and
// features specs) in the installed Firefox through Puppeteer and WebDriver BiDi. Playwright's own Firefox
// build won't start on some Windows 11 builds, so this drives the regular Firefox instead.
// Set FIREFOX_PATH if Firefox is not in its default location. Exits 1 if any test fails.
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const PORT = 4175
const BASE = `http://127.0.0.1:${PORT}`
const FIREFOX = process.env.FIREFOX_PATH || {
  win32: 'C:/Program Files/Mozilla Firefox/firefox.exe',
  darwin: '/Applications/Firefox.app/Contents/MacOS/firefox',
}[process.platform] || '/usr/bin/firefox'
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const TL = readFileSync('node_modules/@testing-library/dom/dist/@testing-library/dom.umd.min.js', 'utf8')
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const PAGES = ['/', '/signin.html', '/create-account.html', '/today.html', '/medications.html', '/messages.html', '/schedule.html', '/symptoms.html', '/account.html', '/nope.html']

function assert(ok, msg) { if (!ok) throw new Error(msg) }

async function waitFor(fn, msg, timeout = 8000) {
  const end = Date.now() + timeout
  let last
  for (;;) {
    try { if (await fn()) return } catch (e) { last = e }
    if (Date.now() > end) throw new Error(`${msg}${last ? ` (${last.message})` : ''}`)
    await new Promise(r => setTimeout(r, 100))
  }
}

// Testing Library's role/label queries, run inside the page (same accessible-name rules as getByRole)
function wrap(page) {
  const inject = async () => {
    if (!(await page.evaluate(() => !!window.TestingLibraryDom))) await page.evaluate(TL)
  }
  const find = async (kind, arg, opts = {}, within = null) => {
    await inject()
    const h = await page.evaluateHandle((kind, arg, opts, within) => {
      const L = window.TestingLibraryDom
      const re = v => (v && v.re ? new RegExp(v.re, v.flags) : v)
      const root = within || document.body
      const o = { ...opts, name: re(opts.name), hidden: false }
      const list = kind === 'role' ? L.queryAllByRole(root, arg, o)
        : kind === 'label' ? L.queryAllByLabelText(root, re(arg))
        : L.queryAllByText(root, re(arg))
      return list[opts.nth || 0] || null
    }, kind, arg, opts, within)
    return h.asElement()
  }
  const get = async (...a) => {
    let el
    await waitFor(async () => (el = await find(...a)), `not found: ${JSON.stringify(a.slice(0, 3))}`)
    return el
  }
  const gone = (...a) => waitFor(async () => !(await find(...a)), `still visible: ${JSON.stringify(a.slice(0, 3))}`)
  const focused = el => page.evaluate(e => document.activeElement === e, el)
  const fill = async (el, text) => {
    await el.click({ count: 3 })
    await page.keyboard.press('Backspace')
    if (text) await el.type(text)
  }
  const attr = (el, name) => page.evaluate((e, n) => e.getAttribute(n), el, name)
  const url = () => page.url()
  return { find, get, gone, focused, fill, attr, url }
}

const rx = (re, flags = '') => ({ re, flags })

async function violations(page) {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
    .map(a => a.finished.catch(() => {}))))
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE)
  return page.evaluate(async tags => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } })
    return r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
  }, TAGS)
}

const tests = []
const test = (name, fn, theme) => tests.push({ name, fn, theme })

for (const theme of ['dark', 'light']) {
  for (const p of PAGES) {
    test(`axe, ${theme} theme › ${p} has no violations`, async (page, $) => {
      await page.goto(BASE + p)
      await $.get('role', 'main')
      const v = await violations(page)
      assert(v.length === 0, v.join('; '))
    }, theme)
  }
  test(`axe, ${theme} theme › missed-dose dialog has no violations`, async (page, $) => {
    await page.goto(BASE + '/medications.html')
    await (await $.get('role', 'button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' })).click()
    await $.get('role', 'alertdialog')
    const v = await violations(page); assert(v.length === 0, v.join('; '))
  }, theme)
  test(`axe, ${theme} theme › SOS dialog has no violations`, async (page, $) => {
    await page.goto(BASE + '/today.html')
    await (await $.get('role', 'button', { name: 'SOS, call emergency contact' })).click()
    await $.get('role', 'alertdialog')
    const v = await violations(page); assert(v.length === 0, v.join('; '))
  }, theme)
  test(`axe, ${theme} theme › call screen has no violations`, async (page, $) => {
    await page.goto(BASE + '/messages.html?c=joyce')
    await (await $.get('role', 'button', { name: 'Call Aunt Joyce' })).click()
    await $.get('role', 'dialog', { name: 'Aunt Joyce' })
    const v = await violations(page); assert(v.length === 0, v.join('; '))
  }, theme)
  test(`axe, ${theme} theme › sign-in errors have no violations`, async (page, $) => {
    await page.goto(BASE + '/signin.html')
    await $.fill(await $.get('label', 'Email address'), 'maddy.example.com')
    await (await $.get('role', 'button', { name: 'Sign in' })).click()
    await $.get('role', 'alert')
    const v = await violations(page); assert(v.length === 0, v.join('; '))
  }, theme)
}

test('focus management › confirm dialog traps Tab and returns focus on Escape', async (page, $) => {
  await page.goto(BASE + '/medications.html')
  const trigger = await $.get('role', 'button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = await $.get('role', 'alertdialog')
  const cancel = await $.get('role', 'button', { name: 'Cancel — go back' })
  await waitFor(() => $.focused(cancel), 'Cancel not focused')
  const inside = () => page.evaluate(d => d.contains(document.activeElement), dialog)
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); assert(await inside(), 'Tab left the dialog') }
  for (let i = 0; i < 5; i++) {
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift')
    assert(await inside(), 'Shift+Tab left the dialog')
  }
  await page.keyboard.press('Escape')
  await $.gone('role', 'alertdialog')
  await waitFor(() => $.focused(trigger), 'focus not returned to the trigger')
})

test('focus management › account menu opens from the keyboard and closes with Escape', async (page, $) => {
  await page.goto(BASE + '/today.html')
  const button = await $.get('role', 'button', { name: rx('account menu', 'i') })
  await button.focus()
  await page.keyboard.press('Enter')
  await $.get('role', 'menu')
  await page.keyboard.press('Escape')
  await $.gone('role', 'menu')
  await waitFor(() => $.focused(button), 'focus not returned to the menu button')
})

test('focus management › keyboard focus is visible by default, and larger with the focus indicator on', async (page, $) => {
  await page.goto(BASE + '/today.html')
  const sos = await $.get('role', 'button', { name: 'SOS, call emergency contact' })
  await sos.focus()
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift')
  await page.keyboard.press('Tab')
  await waitFor(() => $.focused(sos), 'SOS not focused')
  const outline = () => page.evaluate(el => { const s = getComputedStyle(el); return `${s.outlineStyle} ${parseFloat(s.outlineWidth)}` }, sos)
  assert((await outline()) === 'solid 2', `outline was ${await outline()}`)
  await page.keyboard.down('Control'); await page.keyboard.press('='); await page.keyboard.up('Control')
  await waitFor(async () => (await page.evaluate(() => document.documentElement.dataset.focusIndicator)) === 'on', 'focus indicator not on')
  assert((await outline()) === 'solid 4', `outline was ${await outline()}`)
})

test('focus management › notifications panel returns focus to the bell on Escape', async (page, $) => {
  await page.goto(BASE + '/today.html')
  const bell = await $.get('role', 'button', { name: rx('^Notifications') })
  await bell.focus()
  await page.keyboard.press('Enter')
  await $.get('role', 'dialog', { name: 'Notifications' })
  await page.keyboard.press('Escape')
  await $.gone('role', 'dialog', { name: 'Notifications' })
  await waitFor(() => $.focused(bell), 'focus not returned to the bell')
})

test('focus management › skip link is the first Tab stop and moves focus to the content', async (page, $) => {
  await page.goto(BASE + '/today.html')
  await $.get('role', 'main')
  const skip = await $.get('role', 'link', { name: 'Skip to content' })
  await page.keyboard.press('Tab')
  await waitFor(() => $.focused(skip), 'skip link is not the first Tab stop')
  const inView = await page.evaluate(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth }, skip)
  assert(inView, 'skip link not in the viewport when focused')
  await page.keyboard.press('Enter')
  await waitFor(() => page.evaluate(() => document.activeElement?.id === 'content'), '#content not focused')
})

test('Landing and sign in › landing page links to sign in and create account', async (page, $) => {
  await page.goto(BASE + '/')
  assert((await page.title()) === 'CareConnect', 'title')
  await $.get('role', 'heading', { level: 1, name: rx('Stay on track') })
  await (await $.get('role', 'link', { name: 'I already have an account' })).click()
  await waitFor(() => /\/signin\.html$/.test($.url()), 'not on sign in')
  await $.get('role', 'heading', { name: 'Sign in' })
})

test('Landing and sign in › signs in and opens Today', async (page, $) => {
  await page.goto(BASE + '/signin.html')
  const email = await $.get('label', 'Email address')
  assert((await page.evaluate(e => e.value, email)) === 'maddy@example.com', 'email prefill')
  await (await $.get('role', 'button', { name: 'Sign in' })).click()
  await waitFor(() => /\/today\.html$/.test($.url()), 'not on Today')
  await $.get('role', 'progressbar', { name: 'Medications taken today' })
})

test('Landing and sign in › shows an error for an invalid email and stays on sign in', async (page, $) => {
  await page.goto(BASE + '/signin.html')
  await $.fill(await $.get('label', 'Email address'), 'maddy.example.com')
  await (await $.get('role', 'button', { name: 'Sign in' })).click()
  const alert = await $.get('role', 'alert')
  await waitFor(async () => (await page.evaluate(e => e.textContent, alert)).includes('Enter an email address like name@example.com.'), 'alert text')
  assert((await $.attr(await $.get('label', 'Email address'), 'aria-invalid')) === 'true', 'aria-invalid')
  assert(/\/signin\.html$/.test($.url()), 'left sign in')
})

test('Landing and sign in › create account validates every field', async (page, $) => {
  await page.goto(BASE + '/create-account.html')
  await $.get('role', 'heading', { name: 'Create your account' })
  await $.fill(await $.get('label', 'Full name'), '')
  await $.fill(await $.get('label', 'Email address'), 'maddy@')
  await (await $.get('role', 'button', { name: 'Care recipient' })).click()
  await waitFor(async () => (await $.attr(await $.get('label', 'Full name'), 'aria-invalid')) === 'true', 'name not invalid')
  assert((await $.attr(await $.get('label', 'Email address'), 'aria-invalid')) === 'true', 'email not invalid')
  assert(/\/create-account\.html$/.test($.url()), 'left create account')
})

test('Landing and sign in › unknown pages show Not found', async (page, $) => {
  await page.goto(BASE + '/no-such-page.html')
  const main = await $.get('role', 'main')
  await waitFor(async () => /not found/i.test(await page.evaluate(e => e.textContent, main)), 'no Not found text')
})

test('Signed-in pages › navigates between every page from the sidebar', async (page, $) => {
  await page.goto(BASE + '/today.html')
  for (const [label, file, title] of [['Medications', 'medications', 'Medications'], ['Messages', 'messages', 'Messages'],
    ['Schedule', 'schedule', 'Schedule'], ['Symptoms', 'symptoms', 'Symptoms'], ['Account', 'account', 'Account'], ['Today', 'today', 'Today']]) {
    const sidebar = await $.get('role', 'complementary', { name: 'Sidebar' })
    await (await $.get('role', 'link', { name: rx(`^${label}`) }, sidebar)).click()
    await waitFor(() => new RegExp(`/${file}\\.html$`).test($.url()), `not on ${file}`)
    await waitFor(async () => (await page.title()) === `${title} · CareConnect`, `title for ${file}`)
  }
})

test('Signed-in pages › logs a dose as taken on Today and undoes it', async (page, $) => {
  await page.goto(BASE + '/today.html')
  await (await $.get('role', 'button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' })).click()
  await $.get('role', 'button', { name: 'Ropivacaine 10 mg, 8:00 PM: taken' })
  await (await $.get('role', 'button', { name: 'Undo' })).click()
  await $.get('role', 'button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' })
})

test('Signed-in pages › marks a dose as missed after confirming', async (page, $) => {
  await page.goto(BASE + '/medications.html')
  await $.get('text', '5 active prescriptions')
  await (await $.get('role', 'button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' })).click()
  await (await $.get('role', 'button', { name: 'Yes, I missed this dose' })).click()
  await $.get('role', 'button', { name: 'Atorvastatin 20 mg, 8:00 PM: missed' })
})

test('Signed-in pages › sends a message reply', async (page, $) => {
  await page.goto(BASE + '/messages.html?c=chen')
  const reply = await $.get('label', 'Reply to Dr. Sarah Chen')
  await $.fill(reply, 'See you Thursday')
  await page.keyboard.press('Enter')
  const list = await $.get('role', 'list', { name: 'Messages with Dr. Sarah Chen' })
  await waitFor(async () => (await page.evaluate(e => e.textContent, list)).includes('See you Thursday'), 'message not in thread')
  await waitFor(async () => (await page.evaluate(e => e.value, await $.get('label', 'Reply to Dr. Sarah Chen'))) === '', 'reply box not cleared')
})

test('Signed-in pages › starts and ends a demo call', async (page, $) => {
  await page.goto(BASE + '/messages.html?c=joyce')
  await (await $.get('role', 'button', { name: 'Call Aunt Joyce' })).click()
  const call = await $.get('role', 'dialog', { name: 'Aunt Joyce' })
  await $.get('role', 'timer', { name: 'Call length' }, call)
  await (await $.get('role', 'button', { name: 'End call' }, call)).click()
  await $.gone('role', 'dialog', { name: 'Aunt Joyce' })
})

test('Signed-in pages › picks a day on the schedule', async (page, $) => {
  await page.goto(BASE + '/schedule.html')
  const days = await $.get('role', 'group', { name: 'Choose a day' })
  await (await $.get('role', 'button', { nth: 5 }, days)).click()
  await waitFor(async () => (await $.attr(await $.get('role', 'button', { nth: 5 }, days), 'aria-pressed')) === 'true', 'day not pressed')
})

test('Signed-in pages › logs a symptom', async (page, $) => {
  await page.goto(BASE + '/symptoms.html')
  await $.get('role', 'heading', { name: '3 logged today' })
  await (await $.get('role', 'button', { name: 'Add a symptom' })).click()
  await $.fill(await $.get('role', 'textbox', { name: 'Symptom' }), 'Dizziness')
  await (await $.get('role', 'button', { name: '1, very mild' })).click()
  await $.fill(await $.get('label', 'Notes (optional)'), 'After standing up')
  await (await $.get('role', 'button', { name: 'Save symptom' })).click()
  await $.get('role', 'heading', { name: '4 logged today' })
  const list = await $.get('role', 'list', { name: 'Symptoms logged today' })
  assert((await page.evaluate(e => e.textContent, list)).includes('Dizziness'), 'symptom not listed')
})

test('Signed-in pages › the theme choice persists across reloads', async (page, $) => {
  await page.goto(BASE + '/account.html')
  await (await $.get('role', 'button', { name: rx('Appearance') })).click()
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
  await waitFor(async () => (await theme()) === 'light', 'theme not light')
  await page.reload()
  await waitFor(async () => (await theme()) === 'light', 'theme not light after reload')
})

test('Signed-in pages › account settings toggle and zoom', async (page, $) => {
  await page.goto(BASE + '/account.html')
  await $.get('role', 'heading', { level: 2, name: 'Madison Hughes' })
  const reminders = await $.get('role', 'switch', { name: rx('^Medication reminders') })
  assert((await $.attr(reminders, 'aria-checked')) === 'true', 'reminders not on')
  await reminders.click()
  await waitFor(async () => (await $.attr(reminders, 'aria-checked')) === 'false', 'reminders not off')
  await (await $.get('role', 'button', { name: 'Zoom in' })).click()
  await $.get('text', '110%')
})

test('Signed-in pages › opens help and the notifications panel', async (page, $) => {
  await page.goto(BASE + '/today.html')
  const banner = await $.get('role', 'banner')
  await (await $.get('role', 'button', { name: rx('^Notifications') }, banner)).click()
  await $.get('role', 'dialog', { name: 'Notifications' })
  await page.keyboard.press('Escape')
  await $.gone('role', 'dialog', { name: 'Notifications' })
  await (await $.get('role', 'button', { name: 'Help' })).click()
  await $.get('role', 'dialog', { name: 'Help' })
  await (await $.get('role', 'button', { name: 'Got it' })).click()
  await $.gone('role', 'dialog', { name: 'Help' })
})

test('Signed-in pages › signs out to the landing page', async (page, $) => {
  await page.goto(BASE + '/account.html')
  const main = await $.get('role', 'main')
  await (await $.get('role', 'button', { name: 'Sign out' }, main)).click()
  await waitFor(() => /:\d+\/$/.test($.url()), 'not on landing page')
})

execFileSync(npx, ['vite', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
const server = spawn(npx, ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
})

const failed = []
try {
  await waitFor(() => fetch(BASE).then(r => r.ok), 'preview server did not start', 30000)
  // no service worker, as in playwright.config.ts, so every test loads the current build
  const browser = await puppeteer.launch({
    browser: 'firefox', executablePath: FIREFOX, headless: true,
    extraPrefsFirefox: { 'dom.serviceWorkers.enabled': false },
  })
  console.log(`${await browser.version()}\n`)
  for (const t of tests) {
    // a fresh context per test, so localStorage starts empty as in Playwright
    const ctx = await browser.createBrowserContext()
    const page = await ctx.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    if (t.theme) await page.evaluateOnNewDocument(th => localStorage.setItem('cc.theme', th), t.theme)
    const start = Date.now()
    try {
      await Promise.race([t.fn(page, wrap(page)), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout after 90 s')), 90_000))])
      console.log(`  ok  ${t.name} (${Date.now() - start} ms)`)
    } catch (e) {
      failed.push(t.name)
      console.log(`  X   ${t.name}\n      ${e.message.split('\n')[0]}`)
    }
    await ctx.close()
  }
  await browser.close()
  console.log(`\n  ${tests.length - failed.length} passed, ${failed.length} failed`)
} finally {
  // shell: true on Windows means killing the child alone would leave vite running
  if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
  else server.kill()
}
if (failed.length) process.exit(1)
