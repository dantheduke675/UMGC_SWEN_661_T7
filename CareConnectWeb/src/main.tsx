import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppStateProvider } from './AppState'
import './index.css'
// First, so the browser's install event is caught before any page has loaded
import './install'
import { PAGE_TITLES } from './nav'
import { router } from './router'

// Each HTML file sets its own <title>; keep it right as the router moves between pages
const setTitle = (path: string) => (document.title = PAGE_TITLES[path] ?? 'Page not found · CareConnect')
setTitle(router.state.location.pathname)
router.subscribe(state => setTitle(state.location.pathname))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  </StrictMode>,
)
