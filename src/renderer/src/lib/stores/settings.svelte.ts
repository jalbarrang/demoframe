import type { AppSettings } from '../../../../shared/ipc-channels'
import { ipc } from '../ipc'

const defaults: AppSettings = {
  saveDirectory: '',
  defaultFormat: 'mp4',
  resolution: 'native',
  frameRate: 30,
  countdownSeconds: 3,
  microphoneDeviceId: null,
  microphoneEnabled: true,
  desktopAudioEnabled: false,
  launchOnLogin: false,
  globalShortcuts: {
    toggleRecord: 'CommandOrControl+Shift+R',
    togglePause: 'CommandOrControl+Shift+P',
    cancelRecord: 'CommandOrControl+Shift+Escape'
  }
}

let settings = $state<AppSettings>({ ...defaults })
let loaded = $state(false)

async function load(): Promise<void> {
  const remote = await ipc.invoke('settings:get')
  settings = remote
  loaded = true
}

async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  settings = { ...settings, [key]: value }
  await ipc.invoke('settings:set', { [key]: value })
}

async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
  settings = { ...settings, ...partial }
  await ipc.invoke('settings:set', partial)
}

export function getSettings() {
  return {
    get current() { return settings },
    get loaded() { return loaded },
    load,
    updateSetting,
    updateSettings
  }
}
