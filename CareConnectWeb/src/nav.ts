// Browser tab titles, by page file
export const PAGE_TITLES: Record<string, string> = {
  '/': 'CareConnect',
  '/index.html': 'CareConnect',
  '/signin.html': 'Sign in · CareConnect',
  '/create-account.html': 'Create account · CareConnect',
  '/today.html': 'Today · CareConnect',
  '/medications.html': 'Medications · CareConnect',
  '/messages.html': 'Messages · CareConnect',
  '/schedule.html': 'Schedule · CareConnect',
  '/symptoms.html': 'Symptoms · CareConnect',
  '/account.html': 'Account · CareConnect',
}

// Signed-in pages, in navigation order
export const NAV_ITEMS = [
  { to: '/today.html', label: 'Today', icon: '🏠' },
  { to: '/medications.html', label: 'Medications', icon: '💊' },
  { to: '/messages.html', label: 'Messages', icon: '💬' },
  { to: '/schedule.html', label: 'Schedule', icon: '📅' },
  { to: '/symptoms.html', label: 'Symptoms', icon: '📊' },
  { to: '/account.html', label: 'Account', icon: '👤' },
]
