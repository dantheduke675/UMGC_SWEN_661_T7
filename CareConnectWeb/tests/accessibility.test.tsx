import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axeViolations, renderApp, sidebar, simulateViewport, tabBar, VIEWPORTS } from './utils'

describe('Accessibility test helpers', () => {
  it('report a real violation (so a clean scan means something)', async () => {
    render(<button type="button" />)
    expect(await axeViolations()).toEqual(expect.arrayContaining([expect.stringMatching(/^button-name/)]))
  })

  it.each([
    ['phone', { sidebar: false, tabBar: true, accessBar: true }],
    ['tablet', { sidebar: true, tabBar: false, accessBar: true }],
    ['desktop', { sidebar: true, tabBar: false, accessBar: false }],
  ] as const)('simulate the %s layout from the Figma design', (size, expected) => {
    renderApp('/today.html')
    const sidebarEl = sidebar()
    const tabBarEl = tabBar()
    const accessBarEl = screen.getByRole('button', { name: /Scroll down/ }).parentElement!
    simulateViewport(size)
    const shown = (el: HTMLElement) => el.style.display !== 'none'
    expect(shown(sidebarEl)).toBe(expected.sidebar)
    expect(shown(tabBarEl)).toBe(expected.tabBar)
    expect(shown(accessBarEl)).toBe(expected.accessBar)
    expect(shown(screen.getByRole('main'))).toBe(true)
  })
})

const PAGES = ['/', '/signin.html', '/create-account.html', '/today.html', '/medications.html', '/schedule.html', '/nope.html']

describe('Accessibility: axe-core scan (WCAG 2.2 A/AA + best practices)', () => {
  // Every page at every device size from the Figma design
  it.each(PAGES.flatMap(path => VIEWPORTS.map(size => [path, size] as const)))('%s on %s has no violations', async (path, size) => {
    renderApp(path)
    expect(await axeViolations(size)).toEqual([])
  })

  it.each(['light', 'dark'])('Today has no violations in %s theme', async theme => {
    localStorage.setItem('cc.theme', theme)
    renderApp('/today.html')
    expect(await axeViolations('phone')).toEqual([])
    expect(await axeViolations('desktop')).toEqual([])
  })

  it.each(VIEWPORTS)('has no violations with the missed-dose dialog open (%s)', async size => {
    const { user } = renderApp('/medications.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' }))
    expect(await axeViolations(size)).toEqual([])
  })

  it('has no violations with the SOS dialog open', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    expect(await axeViolations('desktop')).toEqual([])
  })

  it('has no violations with the voice panel open', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    expect(await axeViolations('tablet')).toEqual([])
  })

  it('has no violations with the profile menu and an undo message open (desktop)', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    expect(await axeViolations('desktop')).toEqual([])
  })

  it('has no violations with the menu drawer open (phone)', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
    expect(await axeViolations('phone')).toEqual([])
  })

  it('has no violations with the sidebar collapsed (tablet)', async () => {
    const { user } = renderApp('/schedule.html')
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(await axeViolations('tablet')).toEqual([])
  })

  it.each(VIEWPORTS)('has no violations when a form shows an error (%s)', async size => {
    const { user } = renderApp('/signin.html')
    await user.clear(screen.getByLabelText('Email address'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await axeViolations(size)).toEqual([])
  })
})

describe('Accessibility: page structure', () => {
  it.each(PAGES)('%s has one main landmark and a level-1 heading', path => {
    renderApp(path)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThanOrEqual(1)
  })

  it('offers a "Skip to content" link that targets the main content', () => {
    renderApp('/today.html')
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content')
  })

  it('names every navigation landmark differently', () => {
    renderApp('/today.html')
    const names = screen.getAllByRole('navigation').map(n => n.getAttribute('aria-label'))
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives the progress bar a name, value and spoken text', () => {
    renderApp('/today.html')
    const bar = screen.getByRole('progressbar', { name: 'Medications taken today' })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuetext', '2 of 9 taken')
  })

  it('hides decorative emoji icons from screen readers', () => {
    renderApp('/today.html')
    const link = within(sidebar()).getByRole('link', { name: 'Medications' })
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('💊')
  })

  it('names each dose button with the medicine, strength and time', () => {
    renderApp('/medications.html')
    for (const button of screen.getAllByRole('button', { name: /^I (took|missed) this/ })) {
      expect(button).toHaveAccessibleName(/^I (took|missed) this: .+ \d+ mg.*, \d{1,2}:\d{2} (AM|PM)$/)
    }
  })

  it('announces undo messages politely in a live region', async () => {
    const { user } = renderApp('/today.html')
    const live = screen.getByRole('status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(live).toHaveTextContent('Marked as taken')
  })

  it('announces form errors with role="alert" and links them to the field', async () => {
    const { user } = renderApp('/create-account.html')
    const password = screen.getByLabelText('Password')
    await user.clear(password)
    await user.click(screen.getByRole('button', { name: 'Caregiver' }))
    const alert = screen.getByRole('alert')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription(expect.stringContaining(alert.textContent!))
  })
})

describe('Accessibility: keyboard', () => {
  it('reaches the sign-in fields and button with Tab and submits with Enter', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.tab() // theme switch
    await user.tab() // Back
    await user.tab()
    expect(screen.getByLabelText('Email address')).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Password')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(currentPath()).toBe('/today.html')
  })

  it('moves focus to the safe choice when a confirm dialog opens', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(screen.getByRole('button', { name: 'Cancel — go back' })).toHaveFocus()
  })

  it('marks a dose taken with the keyboard alone', async () => {
    const { user } = renderApp('/today.html')
    screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 9 taken')
  })

  it('confirms a missed dose with the keyboard alone', async () => {
    const { user } = renderApp('/today.html')
    screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }).focus()
    await user.keyboard('{Enter}')
    await user.tab({ shift: true }) // from Cancel back to "Yes, I missed this dose"
    expect(screen.getByRole('button', { name: 'Yes, I missed this dose' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: missed' })).toBeInTheDocument()
  })

  it('focuses the first item when the profile menu opens', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    expect(screen.getByRole('menuitem', { name: 'Use light theme' })).toHaveFocus()
  })

  it('focuses Cancel when the voice panel opens', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
})

describe('Accessibility: tremor-friendly targets', () => {
  // The design uses large controls for people with a tremor; check the sizing classes
  it('uses 52px-tall dose buttons', () => {
    renderApp('/today.html')
    for (const button of screen.getAllByRole('button', { name: /^I (took|missed) this/ })) expect(button).toHaveClass('h-[52px]')
  })

  it('uses at least 64px-tall sign-in buttons and fields on phones', () => {
    renderApp('/signin.html')
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveClass('h-16')
    expect(screen.getByLabelText('Email address')).toHaveClass('h-16')
  })

  it('uses 64px-tall scroll and voice buttons', () => {
    renderApp('/today.html')
    expect(screen.getByRole('button', { name: /Scroll down/ })).toHaveClass('h-16')
    expect(screen.getAllByRole('button', { name: 'Voice commands' }).at(-1)).toHaveClass('h-16')
  })
})
