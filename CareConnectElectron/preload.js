'use strict'

// Sandboxed preload: exposes only the zoom controls the renderer needs.
const { contextBridge, webFrame } = require('electron')

contextBridge.exposeInMainWorld('careconnect', {
  getZoom: () => webFrame.getZoomFactor(),
  setZoom: factor => webFrame.setZoomFactor(factor)
})
