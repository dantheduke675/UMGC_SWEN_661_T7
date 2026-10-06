const { app, BrowserWindow, Menu } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'CareConnect',
    backgroundColor: '#0f1420',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // The default menu is gone, so keep F12 for developer tools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools()
  })

  win.loadFile(path.join(__dirname, 'src', 'index.html'))
}

app.whenReady().then(() => {
  // The default menu's accelerators (Ctrl+R reload, Ctrl+/- zoom, ...) would
  // run before the renderer's own keyboard shortcuts, so remove it. macOS keeps
  // its menu because the standard edit commands live there.
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
