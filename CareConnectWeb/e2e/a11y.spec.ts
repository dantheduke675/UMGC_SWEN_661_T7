import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// axe-core in a real browser engine: unlike the jsdom scans in tests/, this
// lays the page out, so colour contrast, target size and visibility rules run
const PAGES = ['/', '/signin.html', '/create-account.html', '/today.html', '/medications.html', '/messages.html', '/schedule.html', '/symptoms.html', '/account.html', '/nope.html']
// A full axe run is slow in WebKit on Windows, especially with many workers
test.describe.configure({ timeout: 90_000 })

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function violations(page: Page) {
  // Let transitions settle so contrast is measured on final colours
  // (infinite ones, like the call screen's pulse, never finish)
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
        .map(a => a.finished.catch(() => {})),
    ),
  )
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`axe, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(t => localStorage.setItem('cc.theme', t), theme)
    })

    for (const path of PAGES) {
      test(`${path} has no violations`, async ({ page }) => {
        await page.goto(path)
        await expect(page.locator('main')).toBeVisible()
        expect(await violations(page)).toEqual([])
      })
    }

    test('missed-dose dialog has no violations', async ({ page }) => {
      await page.goto('/medications.html')
      await page.getByRole('button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' }).click()
      await expect(page.getByRole('alertdialog')).toBeVisible()
      expect(await violations(page)).toEqual([])
    })

    test('SOS dialog has no violations', async ({ page }) => {
      await page.goto('/today.html')
      await page.getByRole('button', { name: 'SOS, call emergency contact' }).click()
      await expect(page.getByRole('alertdialog')).toBeVisible()
      expect(await violations(page)).toEqual([])
    })

    test('call screen has no violations', async ({ page }) => {
      await page.goto('/messages.html?c=joyce')
      await page.getByRole('button', { name: 'Call Aunt Joyce' }).click()
      await expect(page.getByRole('dialog', { name: 'Aunt Joyce' })).toBeVisible()
      expect(await violations(page)).toEqual([])
    })

    test('sign-in errors have no violations', async ({ page }) => {
      await page.goto('/signin.html')
      await page.getByLabel('Email address').fill('maddy.example.com')
      await page.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      expect(await violations(page)).toEqual([])
    })
  })
}

// Focus management in a real browser: Tab stays inside a modal, Escape closes
// it, and focus goes back to the control that opened it
test.describe('focus management', () => {
  test('confirm dialog traps Tab and returns focus on Escape', async ({ page }) => {
    await page.goto('/medications.html')
    const trigger = page.getByRole('button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('alertdialog')
    // Starts on the safe choice
    await expect(page.getByRole('button', { name: 'Cancel — go back' })).toBeFocused()
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true)
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab')
      expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('account menu opens from the keyboard and closes with Escape', async ({ page }) => {
    await page.goto('/today.html')
    const button = page.getByRole('button', { name: /account menu/i })
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(button).toBeFocused()
  })

  test('keyboard focus is visible by default, and larger with the focus indicator on', async ({ page }) => {
    await page.goto('/today.html')
    const sos = page.getByRole('button', { name: 'SOS, call emergency contact' })
    // Reach it by keyboard, so :focus-visible applies as it would for a user
    await sos.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(sos).toBeFocused()
    const outline = () => sos.evaluate(el => {
      const s = getComputedStyle(el)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    expect(await outline()).toEqual({ style: 'solid', width: 2 })
    await page.keyboard.press('Control+=')
    await expect(page.locator('html')).toHaveAttribute('data-focus-indicator', 'on')
    expect(await outline()).toEqual({ style: 'solid', width: 4 })
  })

  test('notifications panel returns focus to the bell on Escape', async ({ page }) => {
    await page.goto('/today.html')
    const bell = page.getByRole('button', { name: /^Notifications/ })
    await bell.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeHidden()
    await expect(bell).toBeFocused()
  })

  test('skip link is the first Tab stop and moves focus to the content', async ({ page, browserName }) => {
    await page.goto('/today.html')
    await expect(page.locator('main')).toBeVisible()
    const skip = page.getByRole('link', { name: 'Skip to content' })
    // Safari's Tab skips every link unless Option + Tab is used (or "Press Tab to
    // highlight each item" is on), on every site; that's the browser, not the page.
    // There we check the skip link still works once focused.
    if (browserName === 'webkit') await skip.focus()
    else await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('#content')).toBeFocused()
  })
})
