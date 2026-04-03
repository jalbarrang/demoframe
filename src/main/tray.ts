import { Tray, Menu, nativeImage } from 'electron'
import type { MainWindow } from './windows/main-window'
import type { RecordingState } from '../shared/ipc-channels'

export class TrayManager {
  private tray: Tray | null = null
  private recordingState: RecordingState = 'idle'

  constructor(
    private mainWindow: MainWindow,
    private onToggleRecord: () => void,
    private onTogglePause: () => void,
    private onQuit: () => void
  ) {}

  create(iconPath?: string): void {
    const icon = iconPath
      ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
      : nativeImage.createEmpty()

    this.tray = new Tray(icon)
    this.tray.setToolTip('DemoFrame')
    this.rebuildMenu()

    this.tray.on('click', () => {
      this.mainWindow.show()
    })
  }

  updateState(state: RecordingState): void {
    this.recordingState = state
    this.rebuildMenu()

    const tooltips: Partial<Record<RecordingState, string>> = {
      idle: 'DemoFrame',
      recording: 'DemoFrame — Recording',
      paused: 'DemoFrame — Paused',
      muxing: 'DemoFrame — Processing…'
    }
    this.tray?.setToolTip(tooltips[state] ?? 'DemoFrame')
  }

  private rebuildMenu(): void {
    const isRecording = this.recordingState === 'recording'
    const isPaused = this.recordingState === 'paused'
    const isActive = isRecording || isPaused

    const menu = Menu.buildFromTemplate([
      { label: 'Show Window', click: () => this.mainWindow.show() },
      { type: 'separator' },
      {
        label: isActive ? 'Stop Recording' : 'Start Recording',
        click: () => this.onToggleRecord()
      },
      {
        label: isPaused ? 'Resume' : 'Pause',
        enabled: isActive,
        click: () => this.onTogglePause()
      },
      { type: 'separator' },
      { label: 'Settings', click: () => this.mainWindow.show() },
      { type: 'separator' },
      { label: 'Quit DemoFrame', click: () => this.onQuit() }
    ])

    this.tray?.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
