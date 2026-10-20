import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGE_TITLES } from '../src/nav'
import { routes } from '../src/router'

// Every page is its own HTML file in the project root
const PAGES = ['index', 'signin', 'create-account', 'today', 'medications', 'schedule', '404']
const read = (file: string) => readFileSync(resolve(__dirname, '..', file), 'utf8')

// All route paths, including nested ones
const routePaths = (list = routes): string[] => list.flatMap(r => [r.path ?? [], ...(r.children ? routePaths(r.children) : [])].flat())

describe('HTML page files', () => {
  it.each(PAGES)('%s.html is a complete, accessible HTML document', page => {
    const html = read(`${page}.html`)
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<html lang="en"')
    expect(html).toContain('<meta charset="UTF-8" />')
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0')
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>')
    expect(html).toContain('<noscript>')
  })

  it.each(PAGES.filter(p => p !== '404'))('%s.html has a route and a matching <title>', page => {
    const path = `/${page}.html`
    expect(routePaths()).toContain(path)
    expect(read(`${page}.html`)).toContain(`<title>${PAGE_TITLES[path]}</title>`)
  })

  it('404.html is titled "Page not found" and kept out of search results', () => {
    const html = read('404.html')
    expect(html).toContain('<title>Page not found · CareConnect</title>')
    expect(html).toContain('<meta name="robots" content="noindex" />')
  })

  it('builds every HTML page (listed in vite.config.ts)', () => {
    const config = read('vite.config.ts')
    const listed = config.match(/const pages = \[([^\]]*)\]/)![1].match(/'([^']+)'/g)!.map(s => s.slice(1, -1))
    expect(listed.sort()).toEqual([...PAGES].sort())
  })

  it('gives every page a description of its own', () => {
    const descriptions = PAGES.filter(p => p !== '404').map(p => read(`${p}.html`).match(/name="description" content="([^"]+)"/)![1])
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })
})
