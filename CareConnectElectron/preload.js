'use strict'

// Sandboxed preload: exposes only the zoom controls the renderer needs.
// The renderer gets no Electron or Node APIs beyond these two functions.
const { contextBridge, webFrame } = require('electron')

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5

contextBridge.exposeInMainWorld('careconnect', {
  getZoom: () => webFrame.getZoomFactor(),
  setZoom: factor => {
    if (typeof factor !== 'number' || !Number.isFinite(factor) || factor < MIN_ZOOM || factor > MAX_ZOOM) return
    webFrame.setZoomFactor(factor)
  }
})
