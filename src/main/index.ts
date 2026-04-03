import { app, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { MainWindow } from './windows/main-window'
import { RecordingBarWindow } from './windows/recording-bar'
import { TrayManager } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { initSettings, getSetting } from './settings'
import { setupDeviceForwarding } from './devices'

import { join } from 'path'
import { existsSync } from 'fs'

const candidateIcon = join(__dirname, '../../resources/icon.png')
const iconPath: string | undefined = existsSync(candidateIcon) ? candidateIcon : undefined

const mainWindow = new MainWindow(iconPath)
const recordingBar = new RecordingBarWindow()

let getRecordingState: () => string = () => 'idle'
let isQuitting = false

const tray = new TrayManager(
  mainWindow,
  () => {
    const state = getRecordingState()
    if (state === 'idle') {
      mainWindow.send('recording:start-requested')
    } else if (state === 'recording' || state === 'paused') {
      mainWindow.send('recording:stop-requested')
    }
  },
  () => {
    const state = getRecordingState()
    if (state === 'recording') {
      mainWindow.send('recording:pause-requested')
    } else if (state === 'paused') {
      mainWindow.send('recording:resume-requested')
    }
  },
  () => {
    isQuitting = true
    mainWindow.setQuitting(true)
    app.quit()
  }
)

function registerGlobalShortcuts(): void {
  globalShortcut.unregisterAll()

  const shortcuts = getSetting('globalShortcuts')

  globalShortcut.register(shortcuts.toggleRecord, () => {
    const state = getRecordingState()
    if (state === 'idle') {
      mainWindow.send('recording:start-requested')
    } else if (state === 'recording' || state === 'paused') {
      mainWindow.send('recording:stop-requested')
    }
  })

  globalShortcut.register(shortcuts.togglePause, () => {
    const state = getRecordingState()
    if (state === 'recording') {
      mainWindow.send('recording:pause-requested')
    } else if (state === 'paused') {
      mainWindow.send('recording:resume-requested')
    }
  })

  globalShortcut.register(shortcuts.cancelRecord, () => {
    const state = getRecordingState()
    if (state === 'recording' || state === 'paused') {
      mainWindow.send('recording:cancel-requested')
    }
  })
}

app.whenReady().then(async () => {
  await initSettings()

  electronApp.setAppUserModelId('cl.dreki.demoframe')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow.create()

  const ipc = registerIpcHandlers({
    mainWindow,
    recordingBar,
    onRecordingStateChange: (state) => {
      tray.updateState(state)
    }
  })
  getRecordingState = ipc.getRecordingState

  tray.create(iconPath)
  registerGlobalShortcuts()
  setupDeviceForwarding(mainWindow)

  app.on('activate', () => {
    mainWindow.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', (e) => {
  if (isQuitting) return

  const state = getRecordingState()
  if (state === 'recording' || state === 'paused') {
    e.preventDefault()
    mainWindow.send('app:confirm-quit')
    mainWindow.show()
    return
  }

  isQuitting = true
  mainWindow.setQuitting(true)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  tray.destroy()
})
