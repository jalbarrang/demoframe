import {
  ipcMain,
  desktopCapturer,
  systemPreferences,
  dialog,
  shell
} from 'electron'
import { readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { join, extname } from 'node:path'
import type { MainWindow } from './windows/main-window'
import type { RecordingBarWindow } from './windows/recording-bar'
import { getSettings, setSettings } from './settings'
import { ChunkWriter } from './recording/chunk-writer'
import { Muxer } from './recording/muxer'
import type { AppUpdater } from './updater'
import type {
  RecordingConfig,
  RecordingState,
  RecordingStatus,
  SourceInfo,
  RecordingMeta,
  OutputFormat
} from '../shared/ipc-channels'

interface IpcDeps {
  mainWindow: MainWindow
  recordingBar: RecordingBarWindow
  updater: AppUpdater
  onRecordingStateChange: (state: RecordingState) => void
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm'])

export function registerIpcHandlers(deps: IpcDeps): {
  chunkWriter: ChunkWriter
  getRecordingState: () => RecordingState
} {
  const { mainWindow, recordingBar, updater, onRecordingStateChange } = deps
  const chunkWriter = new ChunkWriter()
  const muxer = new Muxer()

  let recordingState: RecordingState = 'idle'
  let recordingStartTime = 0
  let activeConfig: RecordingConfig | null = null

  function setState(state: RecordingState, extra?: { error?: string; outputPath?: string }): void {
    recordingState = state
    onRecordingStateChange(state)

    const status: RecordingStatus = { state }
    if (recordingStartTime > 0) status.elapsedMs = Date.now() - recordingStartTime
    if (extra?.error) status.error = extra.error
    if (extra?.outputPath) status.outputPath = extra.outputPath

    mainWindow.send('recording:status', status)
    recordingBar.send('recording:status', status)
  }

  // --- Sources ---

  ipcMain.handle('sources:list', async (_e, args: { types: ('screen' | 'window')[] }) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: args.types,
        thumbnailSize: { width: 320, height: 180 }
      })
      if (!sources) return []
      return sources.map<SourceInfo>((s) => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail.toDataURL(),
        displayId: s.display_id,
        appIcon: s.appIcon?.toDataURL()
      }))
    } catch {
      return []
    }
  })

  // --- Settings ---

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:set', (_e, partial) => setSettings(partial))

  // --- Recording lifecycle ---

  ipcMain.handle('recording:start', (_e, config: RecordingConfig) => {
    if (recordingState !== 'idle') return
    activeConfig = config
    chunkWriter.startSession()
    recordingStartTime = Date.now()
    setState('recording')
    mainWindow.hide()
    recordingBar.show()
  })

  ipcMain.handle('recording:stop', async () => {
    if (recordingState !== 'recording' && recordingState !== 'paused') return
    setState('stopping')

    try {
      const files = chunkWriter.finalize()
      setState('muxing')

      const settings = getSettings()
      const meta = await muxer.mux({
        videoPath: files.videoPath,
        audioPath: files.audioPath,
        outputDir: settings.saveDirectory,
        format: activeConfig?.outputFormat ?? settings.defaultFormat,
        resolution: activeConfig?.resolution ?? { width: 0, height: 0 }
      })

      // Clean up temp files
      if (existsSync(files.sessionDir)) {
        rmSync(files.sessionDir, { recursive: true, force: true })
      }

      recordingBar.hide()
      mainWindow.show()
      setState('complete', { outputPath: meta.path })
      mainWindow.send('recording:complete', { path: meta.path, meta })

      recordingStartTime = 0
      activeConfig = null
      setState('idle')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      recordingBar.hide()
      mainWindow.show()
      setState('error', { error: message })
      recordingStartTime = 0
      activeConfig = null
    }
  })

  ipcMain.handle('recording:pause', () => {
    if (recordingState !== 'recording') return
    setState('paused')
  })

  ipcMain.handle('recording:resume', () => {
    if (recordingState !== 'paused') return
    setState('recording')
  })

  ipcMain.handle('recording:cancel', () => {
    chunkWriter.cancel()
    recordingBar.hide()
    mainWindow.show()
    recordingStartTime = 0
    activeConfig = null
    setState('cancelled')
    setState('idle')
  })

  ipcMain.handle('recording:status', () => {
    const status: RecordingStatus = { state: recordingState }
    if (recordingStartTime > 0) status.elapsedMs = Date.now() - recordingStartTime
    return status
  })

  ipcMain.handle('recording:chunk', (_e, data: { video?: ArrayBuffer; audio?: ArrayBuffer }) => {
    chunkWriter.writeChunk(data)
  })

  // --- Library ---

  ipcMain.handle('library:list', () => {
    const settings = getSettings()
    const dir = settings.saveDirectory
    if (!existsSync(dir)) return []

    const files = readdirSync(dir).filter((f) => VIDEO_EXTENSIONS.has(extname(f).toLowerCase()))
    return files.map<RecordingMeta>((filename) => {
      const filePath = join(dir, filename)
      const stat = statSync(filePath)
      const format = extname(filename).slice(1) as OutputFormat
      return {
        id: filename,
        filename,
        path: filePath,
        format,
        createdAt: stat.birthtime.toISOString(),
        durationMs: 0,
        fileSize: stat.size,
        resolution: { width: 0, height: 0 }
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  ipcMain.handle('library:delete', (_e, args: { id: string }) => {
    const settings = getSettings()
    const filePath = join(settings.saveDirectory, args.id)
    if (existsSync(filePath)) {
      rmSync(filePath)
    }
  })

  ipcMain.handle('library:open-file', (_e, args: { path: string }) => {
    shell.openPath(args.path)
  })

  ipcMain.handle('library:open-folder', (_e, args: { path: string }) => {
    shell.showItemInFolder(args.path)
  })

  ipcMain.handle('library:re-export', async (_e, args: { id: string; format: OutputFormat }) => {
    const settings = getSettings()
    const sourcePath = join(settings.saveDirectory, args.id)
    if (!existsSync(sourcePath)) throw new Error('Source file not found')

    const meta = await muxer.mux({
      videoPath: sourcePath,
      audioPath: null,
      outputDir: settings.saveDirectory,
      format: args.format,
      resolution: { width: 0, height: 0 }
    })

    return { path: meta.path }
  })

  // --- App permissions & dialogs ---

  ipcMain.handle('app:check-permissions', () => {
    return {
      screenRecording: systemPreferences.getMediaAccessStatus('screen') === 'granted',
      microphone: systemPreferences.getMediaAccessStatus('microphone') === 'granted'
    }
  })

  ipcMain.handle('app:request-mic-permission', async () => {
    if (process.platform === 'darwin') {
      return systemPreferences.askForMediaAccess('microphone')
    }
    return true
  })

  ipcMain.handle('app:open-screen-recording-prefs', () => {
    if (process.platform === 'darwin') {
      exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"')
    }
  })

  ipcMain.handle('app:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // --- Crash recovery ---

  ipcMain.handle('app:get-recovery-files', () => {
    return ChunkWriter.getRecoveryFiles()
  })

  ipcMain.handle('app:recover-recording', async () => {
    const recovery = ChunkWriter.getRecoveryFiles()
    if (!recovery) return null

    try {
      const settings = getSettings()
      const videoPath = join(recovery.sessionDir, 'video.h264')
      const audioPath = join(recovery.sessionDir, 'audio.opus')

      const meta = await muxer.mux({
        videoPath: existsSync(videoPath) ? videoPath : null,
        audioPath: existsSync(audioPath) ? audioPath : null,
        outputDir: settings.saveDirectory,
        format: settings.defaultFormat,
        resolution: { width: 0, height: 0 }
      })

      rmSync(recovery.sessionDir, { recursive: true, force: true })
      return meta
    } catch {
      return null
    }
  })

  ipcMain.handle('app:discard-recovery', () => {
    ChunkWriter.discardRecoveryFiles()
  })

  // --- Updates ---

  ipcMain.handle('app:get-update-status', () => {
    return updater.getStatus()
  })

  ipcMain.handle('app:check-for-updates', async () => {
    return updater.checkForUpdates()
  })

  ipcMain.handle('app:quit-and-install-update', () => {
    updater.quitAndInstall()
  })

  // --- Devices (renderer initiates, we forward) ---

  ipcMain.handle('devices:list', () => {
    return []
  })

  return {
    chunkWriter,
    getRecordingState: () => recordingState
  }
}
