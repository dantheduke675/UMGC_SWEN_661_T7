import { expect, test } from '@playwright/test'

// Runs on the phone project: the sidebar collapses into an icon rail
test.describe('Phone layout', () => {
  test('opens the menu and navigates', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only')
    await page.goto('/today.html')
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    await page.getByRole('link', { name: /^Schedule/ }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/schedule\.html$/)
  })

  test('the page fits the screen with no horizontal scroll', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only')
    for (const path of ['/', '/today.html', '/medications.html', '/messages.html', '/account.html']) {
      await page.goto(path)
      await expect(page.getByRole('main')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })
})
