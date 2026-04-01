import type { BrowserWindow } from 'electron'

export function setupDeviceForwarding(mainWindow: { window: BrowserWindow | null }): void {
  const sendDeviceChange = (): void => {
    if (mainWindow.window && !mainWindow.window.isDestroyed()) {
      mainWindow.window.webContents.send('devices:changed', null)
    }
  }

  // Periodically poll for device changes since Electron's main process
  // doesn't have native device-change events for audio devices.
  // The renderer will re-enumerate devices when it receives this nudge.
  const POLL_INTERVAL_MS = 5_000
  let intervalId: ReturnType<typeof setInterval> | null = null

  const start = (): void => {
    if (!intervalId) {
      intervalId = setInterval(sendDeviceChange, POLL_INTERVAL_MS)
    }
  }

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  start()

  return void (() => {
    stop
  })()
}
