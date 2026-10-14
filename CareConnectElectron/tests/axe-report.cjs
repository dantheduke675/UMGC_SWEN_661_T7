'use strict'

// Builds the HTML report for tests/axe-electron.cjs: a self-contained page
// (no external files) listing every view scanned, with its errors, warnings
// and the rules it passed.

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// views: [{ pass, view, issues: [{ kind, id, impact, help, nodes: [{ target, summary }] }],
//           passed: [{ id, help, elements }], inapplicable }]
function buildReport({ views, axeVersion, appVersion, tags, date = new Date() }) {
  const count = (v, kind) => v.issues.filter(i => i.kind === kind).reduce((n, i) => n + i.nodes.length, 0)
  const errors = views.reduce((n, v) => n + count(v, 'violation'), 0)
  const warnings = views.reduce((n, v) => n + count(v, 'needs review'), 0)
  const clean = errors === 0 && warnings === 0
  const passes = [...new Set(views.map(v => v.pass))]
  const id = v => `${v.pass}-${v.view}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

  const table = pass => `
    <table>
      <caption>${esc(pass[0].toUpperCase() + pass.slice(1))}</caption>
      <thead><tr><th scope="col">Screen</th><th scope="col">Errors</th><th scope="col">Warnings</th><th scope="col">Rules passed</th><th scope="col">Result</th></tr></thead>
      <tbody>${views.filter(v => v.pass === pass).map(v => {
        const e = count(v, 'violation'), w = count(v, 'needs review'), ok = e + w === 0
        return `
        <tr>
          <th scope="row"><a href="#${id(v)}">${esc(v.view)}</a></th>
          <td>${e}</td><td>${w}</td><td>${v.passed.length}</td>
          <td><span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'Pass' : 'Fail'}</span></td>
        </tr>`
      }).join('')}
      </tbody>
    </table>`

  const issueList = v => v.issues.length ? `
      <h4>Issues</h4>
      <ul class="issues">${v.issues.map(i => `
        <li><strong>${i.kind === 'violation' ? 'Error' : 'Warning'} (${esc(i.impact || 'n/a')}): ${esc(i.id)}</strong> — ${esc(i.help)}
          <ul>${i.nodes.map(n => `<li><code>${esc(n.target)}</code><br>${esc(n.summary)}</li>`).join('')}</ul>
        </li>`).join('')}
      </ul>` : '<p class="none">No errors or warnings.</p>'

  const details = v => `
    <section id="${id(v)}" aria-labelledby="${id(v)}-h">
      <h3 id="${id(v)}-h">${esc(v.pass)} / ${esc(v.view)}</h3>
      ${issueList(v)}
      <details>
        <summary>${plural(v.passed.length, 'rule')} passed · ${v.inapplicable} not applicable</summary>
        <table class="rules">
          <caption class="sr-only">Rules passed on ${esc(v.pass)} / ${esc(v.view)}</caption>
          <thead><tr><th scope="col">Rule</th><th scope="col">What it checks</th><th scope="col">Elements</th></tr></thead>
          <tbody>${v.passed.map(r => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.help)}</td><td>${r.elements}</td></tr>`).join('')}</tbody>
        </table>
      </details>
    </section>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CareConnect accessibility report</title>
<style>
  :root { --bg: #ffffff; --text: #1a2233; --muted: #4a5468; --line: #d5dae3; --ok: #146c43; --ok-bg: #d8f3e6; --bad: #a61b1b; --bad-bg: #fde2e2; --head: #f2f4f8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1420; --text: #f3f4f6; --muted: #b4bccb; --line: #2c3547; --ok: #7ee2b0; --ok-bg: #12352a; --bad: #ffb4b4; --bad-bg: #4a1b1b; --head: #1a2232; }
  }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.5 "Segoe UI", system-ui, sans-serif; }
  main { max-width: 1000px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { margin: 0 0 8px; } h2 { margin-top: 40px; } h3 { margin-bottom: 8px; text-transform: capitalize; }
  .meta { color: var(--muted); margin: 0 0 24px; }
  .status { padding: 16px 20px; border-radius: 10px; font-weight: 700; }
  .status.ok { background: var(--ok-bg); color: var(--ok); } .status.bad { background: var(--bad-bg); color: var(--bad); }
  dl.facts { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; } dl.facts dt { font-weight: 700; } dl.facts dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  caption { text-align: left; font-weight: 700; font-size: 1.15rem; padding: 6px 0; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  thead th { background: var(--head); }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
  .badge.ok { background: var(--ok-bg); color: var(--ok); } .badge.bad { background: var(--bad-bg); color: var(--bad); }
  section { border-top: 1px solid var(--line); padding-top: 8px; }
  .none { color: var(--ok); font-weight: 600; }
  .issues { color: var(--bad); } .issues li { margin-bottom: 8px; }
  details { margin: 8px 0 20px; } summary { cursor: pointer; font-weight: 600; }
  code { font-family: Consolas, monospace; overflow-wrap: anywhere; }
  a { color: inherit; }
  a:focus-visible, summary:focus-visible { outline: 3px solid #fbbf24; outline-offset: 2px; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 640px) { th, td { padding: 6px; font-size: .9rem; } }
</style>
</head>
<body>
<main>
  <h1>CareConnect accessibility report</h1>
  <p class="meta">CareConnect Desktop v${esc(appVersion)} · scanned ${esc(date.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }))}</p>
  <p class="status ${clean ? 'ok' : 'bad'}">${clean
    ? `Pass: 0 errors and 0 warnings across ${plural(views.length, 'view')}.`
    : `Fail: ${plural(errors, 'error')} and ${plural(warnings, 'warning')} across ${plural(views.length, 'view')}.`}</p>

  <h2>How this was tested</h2>
  <dl class="facts">
    <dt>Tool</dt><dd>axe-core ${esc(axeVersion)} (the engine used by axe DevTools), run inside the Electron app</dd>
    <dt>Rules</dt><dd>${esc(tags.join(', '))}</dd>
    <dt>Themes</dt><dd>${esc(passes.join(', '))}</dd>
    <dt>Errors</dt><dd>axe violations: rules the page fails</dd>
    <dt>Warnings</dt><dd>axe "needs review" items: checks axe could not decide automatically</dd>
  </dl>

  <h2>Summary</h2>
  ${passes.map(table).join('')}

  <h2>Details by screen</h2>
  ${views.map(details).join('')}
</main>
</body>
</html>
`
}

module.exports = { buildReport }
