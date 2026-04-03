export type RecordingState =
  | 'idle'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'muxing'
  | 'complete'
  | 'cancelled'
  | 'error'

export type OutputFormat = 'mp4' | 'mkv'

export type ResolutionPreset = 'native' | 'logical'
export type ResolutionCustom = { width: number; height: number }
export type ResolutionSetting = ResolutionPreset | ResolutionCustom

export interface RecordingConfig {
  sourceId: string
  resolution: { width: number; height: number }
  frameRate: number
  audioDeviceId: string | null
  outputFormat: OutputFormat
}

export interface RecordingStatus {
  state: RecordingState
  elapsedMs?: number
  error?: string
  outputPath?: string
}

export interface SourceInfo {
  id: string
  name: string
  thumbnail: string
  displayId: string
  appIcon?: string
}

export interface DeviceInfo {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput' | 'videoinput'
}

export interface RecordingMeta {
  id: string
  filename: string
  path: string
  format: OutputFormat
  createdAt: string
  durationMs: number
  fileSize: number
  thumbnailPath?: string
  resolution: { width: number; height: number }
}

export interface AppSettings {
  saveDirectory: string
  defaultFormat: OutputFormat
  resolution: ResolutionSetting
  frameRate: 30 | 60
  countdownSeconds: 0 | 3 | 5
  microphoneDeviceId: string | null
  microphoneEnabled: boolean
  desktopAudioEnabled: boolean
  launchOnLogin: boolean
  globalShortcuts: {
    toggleRecord: string
    togglePause: string
    cancelRecord: string
  }
}

export type AppUpdateState =
  | 'idle'
  | 'disabled'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'

export interface AppUpdateStatus {
  state: AppUpdateState
  currentVersion: string
  availableVersion?: string
  progressPercent?: number
  checkedAt?: string
  message?: string
}

export type IpcChannelMap = {
  'recording:start': { request: RecordingConfig; response: void }
  'recording:stop': { request: void; response: void }
  'recording:pause': { request: void; response: void }
  'recording:resume': { request: void; response: void }
  'recording:cancel': { request: void; response: void }
  'recording:status': { request: void; response: RecordingStatus }
  'recording:chunk': { request: { video?: ArrayBuffer; audio?: ArrayBuffer; timestamp: number }; response: void }
  'recording:complete': { request: void; response: { path: string; meta: RecordingMeta } }

  'sources:list': { request: { types: ('screen' | 'window')[] }; response: SourceInfo[] }

  'devices:list': { request: void; response: DeviceInfo[] }
  'devices:changed': { request: void; response: DeviceInfo[] }

  'settings:get': { request: void; response: AppSettings }
  'settings:set': { request: Partial<AppSettings>; response: void }

  'library:list': { request: void; response: RecordingMeta[] }
  'library:delete': { request: { id: string }; response: void }
  'library:open-file': { request: { path: string }; response: void }
  'library:open-folder': { request: { path: string }; response: void }
  'library:re-export': { request: { id: string; format: OutputFormat }; response: { path: string } }

  'app:check-permissions': { request: void; response: { screenRecording: boolean; microphone: boolean } }
  'app:request-mic-permission': { request: void; response: boolean }
  'app:open-screen-recording-prefs': { request: void; response: void }
  'app:select-directory': { request: void; response: string | null }
  'app:get-recovery-files': { request: void; response: { count: number; totalSize: number } | null }
  'app:recover-recording': { request: void; response: RecordingMeta | null }
  'app:discard-recovery': { request: void; response: void }
  'app:get-update-status': { request: void; response: AppUpdateStatus }
  'app:check-for-updates': { request: void; response: AppUpdateStatus }
  'app:quit-and-install-update': { request: void; response: void }
  'app:update-status': { request: void; response: AppUpdateStatus }
}

export type IpcChannel = keyof IpcChannelMap
export type IpcRequest<C extends IpcChannel> = IpcChannelMap[C]['request']
export type IpcResponse<C extends IpcChannel> = IpcChannelMap[C]['response']

export type IpcEventChannel =
  | 'recording:status'
  | 'recording:complete'
  | 'devices:changed'
  | 'app:update-status'
export type IpcInvokeChannel = Exclude<IpcChannel, IpcEventChannel>
