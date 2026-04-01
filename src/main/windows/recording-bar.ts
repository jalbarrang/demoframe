import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export class RecordingBarWindow {
  window: BrowserWindow | null = null

  create(): void {
    this.window = new BrowserWindow({
      width: 320,
      height: 56,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/recording-bar`)
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: '/recording-bar'
      })
    }
  }

  show(): void {
    if (!this.window || this.window.isDestroyed()) {
      this.create()
    }
    this.window!.show()
  }

  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide()
    }
  }

  send(channel: string, ...args: unknown[]): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, ...args)
    }
  }

  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy()
      this.window = null
    }
  }
}
