import { StrictMode, isValidElement, type ReactElement } from 'react'
import { expect, it, vi } from 'vitest'

const { renderRoot, createRoot } = vi.hoisted(() => {
  const renderRoot = vi.fn()
  return { renderRoot, createRoot: vi.fn(() => ({ render: renderRoot })) }
})
// Only replace the host root: route definitions, title subscription and entry
// module execute normally; the rest of the suite tests the rendered app.
vi.mock('react-dom/client', () => ({ createRoot }))

it('boots a StrictMode application into #root and synchronizes known and unknown route titles', async () => {
  document.body.innerHTML = '<div id="root"></div>'
  await import('../src/main')
  const { router } = await import('../src/router')
  expect(createRoot).toHaveBeenCalledExactlyOnceWith(document.getElementById('root'))
  const tree = renderRoot.mock.calls[0][0] as ReactElement
  expect(isValidElement(tree)).toBe(true)
  expect(tree.type).toBe(StrictMode)
  expect(document.title).toBe('CareConnect')
  await router.navigate('/today.html')
  expect(document.title).toBe('Today · CareConnect')
  await router.navigate('/not-a-real-page')
  expect(document.title).toBe('Page not found · CareConnect')
  router.dispose()
})
