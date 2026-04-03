import { app } from 'electron'
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo
} from 'electron-updater'
import type { AppUpdateStatus } from '../shared/ipc-channels'

export class AppUpdater {
  private status: AppUpdateStatus = {
    state: 'idle',
    currentVersion: app.getVersion(),
    message: 'Automatic updates are configured.'
  }
  private initialized = false
  private canUseUpdater = false
  private checkInFlight: Promise<AppUpdateStatus> | null = null

  constructor(private onStatusChange: (status: AppUpdateStatus) => void) {}

  init(): void {
    if (this.initialized) return
    this.initialized = true

    this.canUseUpdater = app.isPackaged || process.env['DEMOFRAME_ENABLE_DEV_UPDATES'] === '1'

    if (!this.canUseUpdater) {
      this.setStatus({
        state: 'disabled',
        currentVersion: app.getVersion(),
        message:
          'Updates are available in packaged builds. Set DEMOFRAME_ENABLE_DEV_UPDATES=1 to test them in development.'
      })
      return
    }

    if (!app.isPackaged) {
      autoUpdater.forceDevUpdateConfig = true
    }

    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowDowngrade = false
    autoUpdater.allowPrerelease = false

    autoUpdater.on('checking-for-update', () => {
      this.setStatus({
        state: 'checking',
        currentVersion: app.getVersion(),
        checkedAt: new Date().toISOString(),
        message: 'Checking for updates…'
      })
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.setStatus({
        state: 'available',
        currentVersion: app.getVersion(),
        availableVersion: info.version,
        checkedAt: new Date().toISOString(),
        message: `Update ${info.version} found. Downloading now…`
      })
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.setStatus({
        state: 'downloading',
        currentVersion: app.getVersion(),
        progressPercent: Math.round(progress.percent),
        message: `Downloading update… ${Math.round(progress.percent)}%`,
        ...(this.status.availableVersion
          ? { availableVersion: this.status.availableVersion }
          : {}),
        ...(this.status.checkedAt ? { checkedAt: this.status.checkedAt } : {})
      })
    })

    autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
      this.setStatus({
        state: 'downloaded',
        currentVersion: app.getVersion(),
        availableVersion: info.version,
        message: `Update ${info.version} is ready to install.`,
        ...(this.status.checkedAt ? { checkedAt: this.status.checkedAt } : {})
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.setStatus({
        state: 'up-to-date',
        currentVersion: app.getVersion(),
        checkedAt: new Date().toISOString(),
        message: 'DemoFrame is up to date.'
      })
    })

    autoUpdater.on('error', (error) => {
      this.setStatus({
        state: 'error',
        currentVersion: app.getVersion(),
        checkedAt: new Date().toISOString(),
        message: error == null ? 'Update check failed.' : error.message,
        ...(this.status.availableVersion
          ? { availableVersion: this.status.availableVersion }
          : {})
      })
    })

    this.setStatus({
      state: 'idle',
      currentVersion: app.getVersion(),
      message: 'Automatic updates are configured.'
    })

    setTimeout(() => {
      void this.checkForUpdates()
    }, 10_000)
  }

  getStatus(): AppUpdateStatus {
    return this.status
  }

  async checkForUpdates(): Promise<AppUpdateStatus> {
    if (!this.initialized) this.init()

    if (!this.canUseUpdater) {
      return this.status
    }

    if (
      this.status.state === 'available' ||
      this.status.state === 'downloading' ||
      this.status.state === 'downloaded'
    ) {
      return this.status
    }

    if (this.checkInFlight) {
      return this.checkInFlight
    }

    this.checkInFlight = (async () => {
      try {
        await autoUpdater.checkForUpdates()
      } catch (error) {
        this.setStatus({
          state: 'error',
          currentVersion: app.getVersion(),
          checkedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error)
        })
      } finally {
        this.checkInFlight = null
      }

      return this.status
    })()

    return this.checkInFlight
  }

  quitAndInstall(): void {
    if (this.status.state !== 'downloaded') return
    autoUpdater.quitAndInstall()
  }

  private setStatus(status: AppUpdateStatus): void {
    this.status = status
    this.onStatusChange(status)
  }
}
