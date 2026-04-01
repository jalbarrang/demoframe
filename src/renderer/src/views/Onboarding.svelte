<script lang="ts">
  import { push } from 'svelte-spa-router'
  import { ipc } from '../lib/ipc'
  import { getSettings } from '../lib/stores/settings.svelte'
  import PermissionStep from '../components/PermissionStep.svelte'

  const settings = getSettings()

  let step = $state(0)
  let screenGranted = $state(false)
  let micGranted = $state(false)
  let dirChosen = $state(false)

  $effect(() => {
    checkPermissions()
  })

  async function checkPermissions() {
    const perms = await ipc.invoke('app:check-permissions')
    screenGranted = perms.screenRecording
    micGranted = perms.microphone
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function requestScreen() {
    await ipc.invoke('app:open-screen-recording-prefs')

    pollTimer = setInterval(async () => {
      const perms = await ipc.invoke('app:check-permissions')
      if (perms.screenRecording) {
        screenGranted = true
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
        step = 1
      }
    }, 2000)
  }

  async function requestMic() {
    const granted = await ipc.invoke('app:request-mic-permission')
    micGranted = granted
    if (granted) step = 2
  }

  async function pickDirectory() {
    const dir = await ipc.invoke('app:select-directory')
    if (dir) {
      await settings.updateSetting('saveDirectory', dir)
      dirChosen = true
      step = 3
    }
  }

  function finish() {
    push('/')
  }

  function skipScreenPermission() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
    step = 1
  }

  const screenStep = {
    title: 'Screen Recording',
    description:
      'Dreki Eye needs permission to capture your screen. Open Privacy & Security → Screen Recording and enable access. In dev mode, look for "Electron" or "Electron Helper" — not the app name.',
    icon: 'M2 3h20v14H2V3zm4 18h12M8 17v4m8-4v4',
    buttonLabel: 'Open System Settings'
  }

  const micStep = {
    title: 'Microphone',
    description: 'Allow microphone access to record audio narration alongside your screen.',
    icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
    buttonLabel: 'Allow Microphone'
  }

  const dirStep = {
    title: 'Save Location',
    description: 'Choose where your recordings will be saved.',
    icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    buttonLabel: 'Choose Folder'
  }
</script>

<div class="flex-1 flex flex-col gap-4 items-center justify-center p-8">
  {#if step < 3}
    <div class=" flex justify-center gap-4 text-center mb-10">
      <div class="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="4" fill="white" />
        </svg>
      </div>

      <div>
        <h1 class="text-2xl font-bold text-text-primary">Welcome to Dreki's Eye</h1>

        <p class="text-sm text-text-secondary mt-2">
          Let's set things up so you can start recording.
        </p>
      </div>
    </div>

    <!-- Progress dots -->
    <div class="flex items-center justify-center gap-2 mb-8">
      {#each [0, 1, 2] as i}
        <div
          class="w-2 h-2 rounded-full transition-colors {i === step
            ? 'bg-accent'
            : i < step
              ? 'bg-success'
              : 'bg-bg-mute'}"
        ></div>
      {/each}
    </div>

    {#if step === 0}
      <PermissionStep
        title={screenStep.title}
        description={screenStep.description}
        icon={screenStep.icon}
        granted={screenGranted}
        buttonLabel={screenStep.buttonLabel}
        onRequest={requestScreen}
      />
      {#if screenGranted}
        <div class="flex justify-center mt-6">
          <button onclick={() => (step = 1)} class="px-5 py-2 text-sm text-accent hover:underline"
            >Continue</button
          >
        </div>
      {:else}
        <div class="flex justify-center mt-4">
          <button
            onclick={skipScreenPermission}
            class="text-sm text-text-muted hover:text-text-secondary">Skip for now</button
          >
        </div>
      {/if}
    {:else if step === 1}
      <PermissionStep
        title={micStep.title}
        description={micStep.description}
        icon={micStep.icon}
        granted={micGranted}
        buttonLabel={micStep.buttonLabel}
        onRequest={requestMic}
      />
      {#if micGranted}
        <div class="flex justify-center mt-6">
          <button onclick={() => (step = 2)} class="px-5 py-2 text-sm text-accent hover:underline"
            >Continue</button
          >
        </div>
      {:else}
        <div class="flex justify-center mt-4">
          <button
            onclick={() => (step = 2)}
            class="text-sm text-text-muted hover:text-text-secondary">Skip</button
          >
        </div>
      {/if}
    {:else if step === 2}
      <PermissionStep
        title={dirStep.title}
        description={dirStep.description}
        icon={dirStep.icon}
        granted={dirChosen}
        buttonLabel={dirStep.buttonLabel}
        onRequest={pickDirectory}
      />
    {/if}
  {:else}
    <div class="flex flex-col items-center text-center gap-6">
      <div
        class="w-20 h-20 rounded-3xl bg-success/15 flex items-center justify-center text-success"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-text-primary">You're all set!</h2>
        <p class="text-sm text-text-secondary mt-2">Start capturing your screen with Dreki Eye.</p>
      </div>
      <button
        onclick={finish}
        class="px-8 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
      >
        Go to Library
      </button>
    </div>
  {/if}
</div>
