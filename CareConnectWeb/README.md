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
| `signin.html`         | Sign in        | Simulated: no credential is checked or sent              |
| `create-account.html` | Create account | Simulated: choosing a role opens the app                 |
| `today.html`          | Today          | Progress, next doses, next appointment                   |
| `medications.html`    | Medications    | Every dose today; mark taken or missed, with undo        |
| `schedule.html`       | Schedule       | Week strip and today's plan                              |
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
| Phone   | < 768px    | Header with Call / Alerts / Video / theme, bottom tab bar, scroll + voice bar, menu drawer |
| Tablet  | 768–1023px | Collapsible sidebar, top bar (voice, eye tracking, SOS, profile menu), scroll + voice bar |
| Desktop | ≥ 1024px   | Full sidebar, top bar, two-column cards                                          |

The sign-in screens show a brand panel beside the form on tablet and desktop,
and the form alone on phones. The landing page hero stacks below 900px.

## Data and privacy

As in the other CareConnect apps, all data is fictional and lives in memory
(`src/data.ts`, `src/AppState.tsx`). Only the light/dark theme preference is
stored in `localStorage`. SOS / Call, video, alerts, eye tracking and voice
commands are demo UI only: no call is placed and no microphone or camera is used.

Network: the app loads the DM Sans and Inter fonts from Google Fonts (cached by
the service worker for offline use). The landing photo is bundled from Unsplash
in `public/landing-photo.jpg`.
