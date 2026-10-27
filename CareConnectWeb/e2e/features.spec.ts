import { expect, test } from '@playwright/test'

test.describe('Signed-in pages', () => {
  test('navigates between every page from the sidebar', async ({ page }) => {
    await page.goto('/today.html')
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })
    for (const [label, file, title] of [
      ['Medications', 'medications', 'Medications'],
      ['Messages', 'messages', 'Messages'],
      ['Schedule', 'schedule', 'Schedule'],
      ['Symptoms', 'symptoms', 'Symptoms'],
      ['Account', 'account', 'Account'],
      ['Today', 'today', 'Today'],
    ]) {
      await sidebar.getByRole('link', { name: new RegExp(`^${label}`) }).click()
      await expect(page).toHaveURL(new RegExp(`/${file}\\.html$`))
      await expect(page).toHaveTitle(`${title} · CareConnect`)
    }
  })

  test('logs a dose as taken on Today and undoes it', async ({ page }) => {
    await page.goto('/today.html')
    await page.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }).click()
    await expect(page.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: taken' })).toBeVisible()
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await expect(page.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' })).toBeVisible()
  })

  test('marks a dose as missed after confirming', async ({ page }) => {
    await page.goto('/medications.html')
    await expect(page.getByText('5 active prescriptions')).toBeVisible()
    await page.getByRole('button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' }).click()
    await page.getByRole('button', { name: 'Yes, I missed this dose' }).click()
    await expect(page.getByRole('button', { name: 'Atorvastatin 20 mg, 8:00 PM: missed' })).toBeVisible()
  })

  test('sends a message reply', async ({ page }) => {
    await page.goto('/messages.html?c=chen')
    const reply = page.getByLabel('Reply to Dr. Sarah Chen')
    await reply.fill('See you Thursday')
    await reply.press('Enter')
    await expect(page.getByRole('list', { name: 'Messages with Dr. Sarah Chen' })).toContainText('See you Thursday')
    await expect(reply).toHaveValue('')
  })

  test('starts and ends a demo call', async ({ page }) => {
    await page.goto('/messages.html?c=joyce')
    await page.getByRole('button', { name: 'Call Aunt Joyce' }).click()
    const call = page.getByRole('dialog', { name: 'Aunt Joyce' })
    await expect(call.getByRole('timer', { name: 'Call length' })).toBeVisible()
    await call.getByRole('button', { name: 'End call' }).click()
    await expect(call).toBeHidden()
  })

  test('picks a day on the schedule', async ({ page }) => {
    await page.goto('/schedule.html')
    const days = page.getByRole('group', { name: 'Choose a day' })
    await expect(days).toBeVisible()
    await days.getByRole('button').nth(5).click()
    await expect(days.getByRole('button').nth(5)).toHaveAttribute('aria-pressed', 'true')
  })

  test('logs a symptom', async ({ page }) => {
    await page.goto('/symptoms.html')
    await expect(page.getByRole('heading', { name: '3 logged today' })).toBeVisible()
    await page.getByRole('button', { name: 'Add a symptom' }).click()
    await page.getByRole('textbox', { name: 'Symptom' }).fill('Dizziness')
    await page.getByRole('button', { name: '1, very mild' }).click()
    await page.getByLabel('Notes (optional)').fill('After standing up')
    await page.getByRole('button', { name: 'Save symptom' }).click()
    await expect(page.getByRole('heading', { name: '4 logged today' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Symptoms logged today' })).toContainText('Dizziness')
  })

  test('the theme choice persists across reloads', async ({ page }) => {
    await page.goto('/account.html')
    await page.getByRole('button', { name: /Appearance/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('account settings toggle and zoom', async ({ page }) => {
    await page.goto('/account.html')
    await expect(page.getByRole('heading', { level: 2, name: 'Madison Hughes' })).toBeVisible()
    const reminders = page.getByRole('switch', { name: /^Medication reminders/ })
    await expect(reminders).toHaveAttribute('aria-checked', 'true')
    await reminders.click()
    await expect(reminders).toHaveAttribute('aria-checked', 'false')
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(page.getByText('110%')).toBeVisible()
  })

  test('opens help and the notifications panel', async ({ page }) => {
    await page.goto('/today.html')
    const banner = page.getByRole('banner')
    await banner.getByRole('button', { name: /^Notifications/ }).click()
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeHidden()
    await page.getByRole('button', { name: 'Help' }).click()
    await expect(page.getByRole('dialog', { name: 'Help' })).toBeVisible()
    await page.getByRole('button', { name: 'Got it' }).click()
    await expect(page.getByRole('dialog', { name: 'Help' })).toBeHidden()
  })

  test('signs out to the landing page', async ({ page }) => {
    await page.goto('/account.html')
    await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)
  })
})
