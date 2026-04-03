import type { AppUpdateStatus } from '../../../../shared/ipc-channels'
import { ipc } from '../ipc'

const defaults: AppUpdateStatus = {
  state: 'idle',
  currentVersion: '',
  message: 'Automatic updates are configured.'
}

let status = $state<AppUpdateStatus>({ ...defaults })
let loaded = $state(false)

async function load(): Promise<void> {
  status = await ipc.invoke('app:get-update-status')
  loaded = true
}

async function checkForUpdates(): Promise<AppUpdateStatus> {
  const next = await ipc.invoke('app:check-for-updates')
  status = next
  loaded = true
  return next
}

async function quitAndInstall(): Promise<void> {
  await ipc.invoke('app:quit-and-install-update')
}

function setupListeners(): () => void {
  return ipc.on('app:update-status', (next) => {
    status = next
    loaded = true
  })
}

export function getUpdates() {
  return {
    get status() { return status },
    get loaded() { return loaded },
    load,
    checkForUpdates,
    quitAndInstall,
    setupListeners
  }
}
