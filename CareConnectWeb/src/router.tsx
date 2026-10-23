import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { RootLayout } from './layouts/RootLayout'
import { Account } from './pages/Account'
import { CreateAccount } from './pages/CreateAccount'
import { Landing } from './pages/Landing'
import { Medications } from './pages/Medications'
import { Messages } from './pages/Messages'
import { NotFound } from './pages/NotFound'
import { Schedule } from './pages/Schedule'
import { SignIn } from './pages/SignIn'
import { Symptoms } from './pages/Symptoms'
import { Today } from './pages/Today'

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
    children: [
      { path: '/', element: <Landing /> },
      { path: '/index.html', element: <Landing /> },
      {
        // Sign-in screens share the brand panel
        element: <AuthLayout />,
        children: [
          { path: '/signin.html', element: <SignIn /> },
          { path: '/create-account.html', element: <CreateAccount /> },
        ],
      },
      {
        // Signed-in pages share the responsive shell
        element: <AppShell />,
        children: [
          { path: '/today.html', element: <Today /> },
          { path: '/medications.html', element: <Medications /> },
          { path: '/messages.html', element: <Messages /> },
          { path: '/schedule.html', element: <Schedule /> },
          { path: '/symptoms.html', element: <Symptoms /> },
          { path: '/account.html', element: <Account /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
