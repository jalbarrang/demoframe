import type { DeviceInfo } from '../../../../shared/ipc-channels'
import { ipc } from '../ipc'

let devices = $state<DeviceInfo[]>([])
let selectedId = $state<string | null>(null)
let isDisconnected = $state(false)

function updateDisconnectedState(): void {
  if (!selectedId) {
    isDisconnected = false
    return
  }
  isDisconnected = !devices.some((d) => d.deviceId === selectedId)
}

async function load(): Promise<void> {
  const all = await navigator.mediaDevices.enumerateDevices()
  devices = all
    .filter((d) => d.kind === 'audioinput')
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
      kind: d.kind as 'audioinput'
    }))
  updateDisconnectedState()
}

function select(deviceId: string | null): void {
  selectedId = deviceId
  updateDisconnectedState()
}

function setupListeners(): () => void {
  const handleChange = (): void => { load() }
  navigator.mediaDevices.addEventListener('devicechange', handleChange)

  const unsubIpc = ipc.on('devices:changed', (updated) => {
    if (!updated) return
    devices = updated.filter((d) => d.kind === 'audioinput')
    updateDisconnectedState()
  })

  return () => {
    navigator.mediaDevices.removeEventListener('devicechange', handleChange)
    unsubIpc()
  }
}

export function getDevices() {
  return {
    get list() { return devices },
    get selectedId() { return selectedId },
    get isDisconnected() { return isDisconnected },
    get selected() {
      return devices.find((d) => d.deviceId === selectedId) ?? null
    },
    load,
    select,
    setupListeners
  }
}
