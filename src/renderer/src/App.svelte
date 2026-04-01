<script lang="ts">
  import Router, { push, router } from 'svelte-spa-router'
  import Sidebar from './components/Sidebar.svelte'
  import Library from './views/Library.svelte'
  import Settings from './views/Settings.svelte'
  import SourcePicker from './views/SourcePicker.svelte'
  import Onboarding from './views/Onboarding.svelte'
  import RecordingBar from './views/RecordingBar.svelte'
  import PostRecording from './views/PostRecording.svelte'
  import { getSettings } from './lib/stores/settings.svelte'
  import { getDevices } from './lib/stores/devices.svelte'
  import { getRecording } from './lib/stores/recording.svelte'
  import { ipc } from './lib/ipc'

  const settings = getSettings()
  const devices = getDevices()
  const recording = getRecording()

  const routes = {
    '/': Library,
    '/settings': Settings,
    '/source-picker': SourcePicker,
    '/onboarding': Onboarding,
    '/recording-bar': RecordingBar,
    '/post-recording': PostRecording
  }

  let isRecordingBar = $derived(router.location === '/recording-bar')

  $effect(() => {
    const init = async () => {
      await settings.load()
      await devices.load()

      if (settings.current.microphoneDeviceId) {
        devices.select(settings.current.microphoneDeviceId)
      }

      if (!settings.loaded) return

      const perms = await ipc.invoke('app:check-permissions')
      const isFirstRun = !settings.current.saveDirectory
      if (!perms.screenRecording && isFirstRun) {
        push('/onboarding')
      }
    }

    init()

    const cleanupDevices = devices.setupListeners()
    const cleanupRecording = recording.setupListeners()

    return () => {
      cleanupDevices()
      cleanupRecording()
    }
  })
</script>

{#if isRecordingBar}
  <div class="h-screen w-screen flex items-center justify-center p-1.5">
    <Router {routes} />
  </div>
{:else}
  <div class="flex h-screen w-screen overflow-hidden">
    <Sidebar />
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Router {routes} />
    </main>
  </div>
{/if}
