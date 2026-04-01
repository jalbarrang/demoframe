import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is, optimizer } from '@electron-toolkit/utils'

export class MainWindow {
  window: BrowserWindow | null = null
  private _isQuitting = false

  constructor(private icon?: string) {}

  create(): void {
    this.window = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#0a0a0f',
      ...(process.platform === 'linux' && this.icon ? { icon: this.icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    this.window.on('ready-to-show', () => {
      this.window!.show()
    })

    this.window.on('close', (e) => {
      if (process.platform === 'darwin' && !this._isQuitting) {
        e.preventDefault()
        this.window!.hide()
      }
    })

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    optimizer.watchWindowShortcuts(this.window)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  show(): void {
    if (!this.window || this.window.isDestroyed()) {
      this.create()
    } else {
      this.window.show()
      this.window.focus()
    }
  }

  hide(): void {
    this.window?.hide()
  }

  send(channel: string, ...args: unknown[]): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, ...args)
    }
  }

  setQuitting(quitting: boolean): void {
    this._isQuitting = quitting
  }
}
