import { useSyncExternalStore } from 'react'

/*
  In-app install. Chrome, Edge and Android fire beforeinstallprompt once the
  app can be installed (manifest + service worker + HTTPS); the event is kept
  so the Install buttons can show the browser's install dialog. Firefox and
  Safari never fire it: they install from their own menus. main.tsx imports
  this module first, so the event is caught even before a page has loaded.
*/

// Not in TypeScript's DOM types yet
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallStatus = 'available' | 'installed' | 'unavailable'

let prompt: InstallPromptEvent | null = null
// Opened from the installed app's icon (it runs in its own window)
let installed = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
const listeners = new Set<() => void>()
const changed = () => listeners.forEach(l => l())

window.addEventListener('beforeinstallprompt', e => {
  // Our own buttons offer the install instead of the browser's mini-infobar
  e.preventDefault()
  prompt = e as InstallPromptEvent
  changed()
})
window.addEventListener('appinstalled', () => {
  prompt = null
  installed = true
  changed()
})

const status = (): InstallStatus => (installed ? 'installed' : prompt ? 'available' : 'unavailable')
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useInstallStatus = () => useSyncExternalStore(subscribe, status)

// Shows the browser's install dialog; true if the person chose to install
export async function installApp() {
  const event = prompt
  if (!event) return false
  // The dialog can be shown only once per event
  prompt = null
  changed()
  await event.prompt()
  return (await event.userChoice).outcome === 'accepted'
}
