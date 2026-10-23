import type { MouseEvent } from 'react'

export type SkipLink = [targetId: string, label: string]

// Moves focus (not just the scroll position) to the target, without changing the URL
function skipTo(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  e.preventDefault()
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1
  target.focus()
}

// The first thing Tab reaches on a page; each link shows only while focused
export function SkipLinks({ links }: { links: SkipLink[] }) {
  return (
    <nav aria-label="Skip links">
      <ul>
        {links.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={e => skipTo(e, id)}
              className="sr-only z-[60] rounded-lg bg-brand px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
