# CareConnect Web

A responsive, installable (PWA) web version of CareConnect, built with
React 19, Vite, React Router and Tailwind CSS 4. The look and layout follow the
team's Figma Make design ("Recreate wireframe design"), including its Desktop,
Tablet and Phone versions.

## Run it

```
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # type-check and production build into dist/
npm run preview   # serve the production build (service worker active)
npm run lint
npm test          # tests in watch mode
npm run test:run  # all tests once
npm run test:a11y # accessibility tests only
npm run test:coverage
```

## Tests

Vitest + React Testing Library + axe-core, running in jsdom (`vitest.config.ts`,
tests in `tests/`). `tests/utils.tsx` renders the real routes in a memory
router (`renderApp('/today.html')`). It also runs axe at a chosen device size:
`simulateViewport` applies the Tailwind visibility classes for phone, tablet or
desktop, because jsdom loads no CSS. Colour contrast is not checked in jsdom;
check it in a browser with axe DevTools or Lighthouse.

## Stack

| Concern | Choice                                                                    |
| ------- | ------------------------------------------------------------------------- |
| Build   | Vite (`npm create vite@latest`, `react-ts` template)                      |
| Pages   | One HTML file per page (Vite multi-page build, see `vite.config.ts`)      |
| Routing | React Router (`createBrowserRouter`, layout routes for auth and the app)  |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`; theme tokens in `src/index.css`   |
| PWA     | `vite-plugin-pwa`: manifest, auto-updating service worker, icons, offline |

## Pages

Each page is its own HTML file in this folder, so every URL is a real
document that any static web server can serve (no rewrite rules needed).
Each file loads the shared code in `src/`, and React Router shows the matching
page; links between pages then switch without a full reload, which keeps the
in-memory dose log.

| HTML file             | Page           | Notes                                                    |
| --------------------- | -------------- | -------------------------------------------------------- |
| `index.html`          | Landing        | Marketing page (always light); also served at `/`        |
| `signin.html`         | Sign in        | Simulated: no credential is checked or sent. "Use Face ID instead" asks first, then shows a short scan (no camera). |
| `create-account.html` | Create account | Simulated: choosing a role opens the app                 |
| `today.html`          | Today          | Progress, next doses, next appointment                   |
| `medications.html`    | Medications    | Every dose today; mark taken or missed, with undo        |
| `messages.html`       | Messages       | Conversations with the care team; open one (`?c=<id>`) full-page to read, reply (typed or one-tap quick replies) and call |
| `schedule.html`       | Schedule       | Week strip and today's plan                              |
| `symptoms.html`       | Symptoms       | Today's symptoms with a 1-5 severity bar; log a new one  |
| `account.html`        | Account        | Profile, preferences (theme, reminders, Face ID), care team, sign out |
| `404.html`            | Not found      | Shown for unknown URLs (and offline by the service worker) |

To add a page: create its HTML file here, add it to `pages` in
`vite.config.ts`, add its route in `src/router.tsx` and its title in
`src/nav.ts`.

`npm run build` writes the same set of HTML files to `dist/`, with the shared
JavaScript and CSS in `dist/assets/`. Open them through a web server
(`npm run preview`), not from disk: browsers block JavaScript modules on
`file://` pages.

## Responsive layout

| Device  | Width      | Signed-in layout                                                                 |
| ------- | ---------- | -------------------------------------------------------------------------------- |
| Phone   | < 768px    | Same as tablet, scaled down: sidebar starts as an icon rail and expands over the page, top bar (SOS, profile menu), scroll + voice bar |
| Tablet  | 768–1023px | Collapsible sidebar, top bar (voice, eye tracking, SOS, profile menu), scroll + voice bar |
| Desktop | ≥ 1024px   | Full sidebar, top bar, two-column cards                                          |

An open conversation fills the page with its own reply box, so it hides the
scroll + voice bar. Calls (from a conversation, or SOS after confirming) open a
full-screen call screen with a running timer, Mute, Speaker and End call.

Every size has a floating **?** button that opens a short guide to the controls.

The sign-in screens show a brand panel beside the form on tablet and desktop,
and the form alone on phones. The landing page hero stacks below 900px.

## Keyboard and screen reader support

Every feature works from the keyboard. The shortcuts are defined in
`src/shortcuts.ts`, handled in `src/layouts/RootLayout.tsx` (voice and SOS in
`AppShell.tsx`), and listed in the **?** Help dialog.

| Keys              | Action                                                        |
| ----------------- | ------------------------------------------------------------- |
| Ctrl + =          | Focus indicator on / off (off by default; remembered)         |
| Arrow keys        | Move the focus indicator to the next / previous control (only while it is on; stays inside an open dialog) |
| Enter             | Press the focused button; submits the sign-in form            |
| Tab / Shift + Tab | Move between controls; trapped inside open dialogs, focus returns to the opener on close |
| Ctrl + + / Ctrl + − / Ctrl + 0 | Zoom in / out (80–200%) / reset                  |
| Ctrl + L          | Light / dark mode                                             |
| Ctrl + \          | Voice commands                                                |
| Ctrl + I          | Eye tracking on / off (simulated)                             |
| Ctrl + O          | Mouse lock on / off (simulated)                               |
| Ctrl + U          | Undo the last action                                          |
| Ctrl + H          | Action history (undo any action)                              |
| Ctrl + S          | Emergency call (asks first)                                   |
| Ctrl + F          | Face ID on / off                                              |
| Ctrl + R          | Refresh the page                                              |
| Ctrl + N          | Medication reminders on / off                                 |

Ctrl + = replaces the browser's own Ctrl + = zoom; use Ctrl + + (Shift + =, or
the numpad +) to zoom. Chrome and Edge reserve Ctrl + N for a new window in a
normal tab, so that shortcut only reaches the app when it is installed (PWA
window) or in browsers that pass it through. Ctrl + Shift + letter is left to
the browser (developer tools and so on).

The focus indicator, eye tracking, mouse lock and the action history are also
on the Account page (Accessibility).

**Structure.** Each layout uses landmarks with names: `banner` (top bar, with
the page's `h1`), `main` (named by that heading), `complementary` (Sidebar),
`navigation` (Primary, Skip links), and a `region` for the scroll and voice
controls. Sections are named by their headings (`aria-labelledby`), and
headings go in order (h1 page title, h2 sections, h3 cards). Every page starts
with skip links (shown only while focused): content, navigation and page tools
in the app; form and help on sign-in; main content and sign in on the landing
page.

## Data and privacy

As in the other CareConnect apps, all data is fictional and lives in memory
(`src/data.ts`, `src/AppState.tsx`). Only UI preferences (theme, focus
indicator, zoom) are stored in `localStorage`. Messages you send, symptoms you
log, Account switches and the action history also stay in memory. SOS, calls,
eye tracking, mouse lock and voice commands are demo UI only: no call is placed
and no microphone or camera is used.

Network: the app loads the DM Sans and Inter fonts from Google Fonts (cached by
the service worker for offline use). The landing photo is bundled from Unsplash
in `public/landing-photo.jpg`.
