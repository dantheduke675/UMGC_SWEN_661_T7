import { expect, test } from '@playwright/test'

test.describe('Landing and sign in', () => {
  test('landing page links to sign in and create account', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('CareConnect')
    await expect(page.getByRole('heading', { level: 1, name: /Stay on track/ })).toBeVisible()
    await page.getByRole('link', { name: 'I already have an account' }).click()
    await expect(page).toHaveURL(/\/signin\.html$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('signs in and opens Today', async ({ page }) => {
    await page.goto('/signin.html')
    await expect(page.getByLabel('Email address')).toHaveValue('maddy@example.com')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page).toHaveURL(/\/today\.html$/)
    await expect(page.getByRole('progressbar', { name: 'Medications taken today' })).toBeVisible()
  })

  test('shows an error for an invalid email and stays on sign in', async ({ page }) => {
    await page.goto('/signin.html')
    await page.getByLabel('Email address').fill('maddy.example.com')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Enter an email address like name@example.com.')
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL(/\/signin\.html$/)
  })

  test('create account validates every field', async ({ page }) => {
    await page.goto('/create-account.html')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await page.getByLabel('Full name').fill('')
    await page.getByLabel('Email address').fill('maddy@')
    await page.getByRole('button', { name: 'Care recipient' }).click()
    await expect(page.getByLabel('Full name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL(/\/create-account\.html$/)
  })

  test('unknown pages show Not found', async ({ page }) => {
    await page.goto('/no-such-page.html')
    await expect(page.getByRole('main')).toContainText(/not found/i)
  })
})
