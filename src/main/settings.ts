import { app } from 'electron'
import { join } from 'node:path'
import type { AppSettings } from '../shared/ipc-channels'

const defaults: AppSettings = {
  saveDirectory: join(app.getPath('videos'), 'DemoFrame'),
  defaultFormat: 'mp4',
  resolution: 'logical',
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

interface StoreInstance<T> {
  store: T
  get<K extends keyof T>(key: K): T[K]
  set<K extends keyof T>(key: K, value: T[K]): void
}

let store: StoreInstance<AppSettings> | null = null

async function getStore(): Promise<StoreInstance<AppSettings>> {
  if (store) return store

  const mod = await import('electron-store')

  const Store = mod.default
  store = new Store<AppSettings>({ defaults }) as unknown as StoreInstance<AppSettings>
  return store
}

let syncStore: StoreInstance<AppSettings> | null = null

export async function initSettings(): Promise<void> {
  syncStore = await getStore()
}

export function getSettings(): AppSettings {
  if (!syncStore) throw new Error('Settings not initialized — call initSettings() first')
  return syncStore.store
}

export function setSettings(partial: Partial<AppSettings>): void {
  if (!syncStore) throw new Error('Settings not initialized — call initSettings() first')
  for (const [key, value] of Object.entries(partial)) {
    syncStore.set(key as keyof AppSettings, value)
  }
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  if (!syncStore) throw new Error('Settings not initialized — call initSettings() first')
  return syncStore.get(key)
}
