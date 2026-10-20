// Browser tab titles, by page file
export const PAGE_TITLES: Record<string, string> = {
  '/': 'CareConnect',
  '/index.html': 'CareConnect',
  '/signin.html': 'Sign in · CareConnect',
  '/create-account.html': 'Create account · CareConnect',
  '/today.html': 'Today · CareConnect',
  '/medications.html': 'Medications · CareConnect',
  '/schedule.html': 'Schedule · CareConnect',
}

// Signed-in pages, in navigation order
export const NAV_ITEMS = [
  { to: '/today.html', label: 'Today', icon: '🏠' },
  { to: '/medications.html', label: 'Medications', icon: '💊' },
  { to: '/schedule.html', label: 'Schedule', icon: '📅' },
]
