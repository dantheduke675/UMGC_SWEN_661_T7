'use strict'

// Development only: serves the app's screens (src/) at http://127.0.0.1:5180
// so they can be scanned with the axe DevTools browser extension in Chrome.
// The extension cannot scan inside Electron itself (Electron lacks extension
// APIs it needs), but src/ is the same page the Electron window shows.
// Read-only, loopback only, and nothing outside src/ is served.
//
// Usage: npm run serve:axe            (port 5180)
//        npm run serve:axe -- 5181    (another port)

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const SRC = path.resolve(__dirname, '..', 'src')
const PORT = Number(process.argv[2] || 5180)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = path.normalize(path.join(SRC, rel === '/' ? 'index.html' : rel))
  if (!file.startsWith(SRC + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404)
    return res.end('Not found')
  }
  // no-store: an edit to src/ shows on the next reload
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
})

server.on('error', err => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} is in use. Try: npm run serve:axe -- ${PORT + 1}` : err.message)
  process.exit(1)
})
server.listen(PORT, '127.0.0.1', () => {
  console.log(`CareConnect screens: http://127.0.0.1:${PORT}/`)
  console.log('Open that address in Chrome, press F12 and use the axe DevTools tab. Ctrl+C stops the server.')
})
