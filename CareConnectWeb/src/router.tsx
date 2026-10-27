import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { RootLayout } from './layouts/RootLayout'

// Each page is its own chunk, loaded when its route is first visited; the
// current page stays on screen while the next one loads
const landing = () => import('./pages/Landing').then(m => ({ Component: m.Landing }))

/*
  Every page has its own HTML file in the project root (index.html, signin.html,
  today.html, ...), so each URL below is a real document a static server can
  serve. Once loaded, the router moves between pages without a reload, which
  keeps the in-memory dose log.
  The route list is exported on its own so tests can mount it in a memory router.
*/
export const routes: RouteObject[] = [
  {
    // Every page: keyboard shortcuts, messages and the action history
    element: <RootLayout />,
    // Shown for the moment the first page's chunk takes to arrive
    hydrateFallbackElement: <p className="sr-only" role="status">Loading CareConnect…</p>,
    children: [
      { path: '/', lazy: landing },
      { path: '/index.html', lazy: landing },
      {
        // Sign-in screens share the brand panel
        element: <AuthLayout />,
        children: [
          { path: '/signin.html', lazy: () => import('./pages/SignIn').then(m => ({ Component: m.SignIn })) },
          { path: '/create-account.html', lazy: () => import('./pages/CreateAccount').then(m => ({ Component: m.CreateAccount })) },
        ],
      },
      {
        // Signed-in pages share the responsive shell
        element: <AppShell />,
        children: [
          { path: '/today.html', lazy: () => import('./pages/Today').then(m => ({ Component: m.Today })) },
          { path: '/medications.html', lazy: () => import('./pages/Medications').then(m => ({ Component: m.Medications })) },
          { path: '/messages.html', lazy: () => import('./pages/Messages').then(m => ({ Component: m.Messages })) },
          { path: '/schedule.html', lazy: () => import('./pages/Schedule').then(m => ({ Component: m.Schedule })) },
          { path: '/symptoms.html', lazy: () => import('./pages/Symptoms').then(m => ({ Component: m.Symptoms })) },
          { path: '/account.html', lazy: () => import('./pages/Account').then(m => ({ Component: m.Account })) },
        ],
      },
      { path: '*', lazy: () => import('./pages/NotFound').then(m => ({ Component: m.NotFound })) },
    ],
  },
]

export const router = createBrowserRouter(routes)
