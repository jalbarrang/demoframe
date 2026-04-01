<script lang="ts">
  import { Switch } from 'bits-ui'
  import { getSettings } from '../lib/stores/settings.svelte'
  import MicSelector from '../components/MicSelector.svelte'
  import { ipc } from '../lib/ipc'
  import type { OutputFormat } from '../../../shared/ipc-channels'

  const settings = getSettings()

  let micDeviceId = $state(settings.current.microphoneDeviceId)

  $effect(() => {
    micDeviceId = settings.current.microphoneDeviceId
  })

  function setFrameRate(fps: 30 | 60) {
    settings.updateSetting('frameRate', fps)
  }

  function setCountdown(s: 0 | 3 | 5) {
    settings.updateSetting('countdownSeconds', s)
  }

  function setFormat(fmt: OutputFormat) {
    settings.updateSetting('defaultFormat', fmt)
  }

  async function browseSaveDir() {
    const dir = await ipc.invoke('app:select-directory')
    if (dir) settings.updateSetting('saveDirectory', dir)
  }

  function toggleMic(checked: boolean) {
    settings.updateSetting('microphoneEnabled', checked)
  }

  function toggleLaunchOnLogin(checked: boolean) {
    settings.updateSetting('launchOnLogin', checked)
  }

  function handleMicSelected(deviceId: string | null) {
    micDeviceId = deviceId
    settings.updateSetting('microphoneDeviceId', deviceId)
  }

  $effect(() => {
    if (micDeviceId !== settings.current.microphoneDeviceId) {
      handleMicSelected(micDeviceId)
    }
  })
</script>

<div class="flex-1 overflow-y-auto">
  <header class="px-6 py-4 border-b border-border">
    <h1 class="text-lg font-semibold text-text-primary">Settings</h1>
  </header>

  <div class="px-6 py-6 space-y-8 max-w-2xl">
    <!-- Recording -->
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Recording</h2>

      <div class="space-y-3">
        <label class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Frame rate</span>
          <div class="flex gap-1 bg-bg-mute rounded-lg p-0.5">
            {#each [30, 60] as fps}
              <button
                onclick={() => setFrameRate(fps as 30 | 60)}
                class="px-3 py-1.5 text-sm rounded-md transition-colors
                  {settings.current.frameRate === fps ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'}"
              >
                {fps} fps
              </button>
            {/each}
          </div>
        </label>

        <label class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Countdown</span>
          <div class="flex gap-1 bg-bg-mute rounded-lg p-0.5">
            {#each [0, 3, 5] as s}
              <button
                onclick={() => setCountdown(s as 0 | 3 | 5)}
                class="px-3 py-1.5 text-sm rounded-md transition-colors
                  {settings.current.countdownSeconds === s ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'}"
              >
                {s === 0 ? 'None' : `${s}s`}
              </button>
            {/each}
          </div>
        </label>
      </div>
    </section>

    <!-- Audio -->
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Audio</h2>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Microphone</span>
          <Switch.Root
            checked={settings.current.microphoneEnabled}
            onCheckedChange={toggleMic}
            class="w-10 h-6 rounded-full relative transition-colors data-[state=checked]:bg-accent bg-bg-mute border border-border"
          >
            <Switch.Thumb class="block w-4 h-4 rounded-full bg-text-primary shadow transition-transform translate-x-1 data-[state=checked]:translate-x-[18px]" />
          </Switch.Root>
        </div>

        {#if settings.current.microphoneEnabled}
          <div>
            <MicSelector bind:value={micDeviceId} />
          </div>
        {/if}

        <div class="flex items-center justify-between opacity-50">
          <div>
            <span class="text-sm text-text-secondary">Desktop Audio</span>
            <span class="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-bg-mute text-text-muted uppercase tracking-wide">Coming soon</span>
          </div>
          <Switch.Root disabled checked={false} class="w-10 h-6 rounded-full relative bg-bg-mute border border-border cursor-not-allowed">
            <Switch.Thumb class="block w-4 h-4 rounded-full bg-text-muted shadow translate-x-1" />
          </Switch.Root>
        </div>
      </div>
    </section>

    <!-- Output -->
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Output</h2>

      <div class="space-y-3">
        <label class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">Default format</span>
          <div class="flex gap-1 bg-bg-mute rounded-lg p-0.5">
            {#each ['mp4', 'mkv'] as fmt}
              <button
                onclick={() => setFormat(fmt as OutputFormat)}
                class="px-3 py-1.5 text-sm rounded-md uppercase transition-colors
                  {settings.current.defaultFormat === fmt ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'}"
              >
                {fmt}
              </button>
            {/each}
          </div>
        </label>

        <div class="flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <span class="text-sm text-text-secondary block">Save location</span>
            <span class="text-xs text-text-muted truncate block mt-0.5">
              {settings.current.saveDirectory || 'Not set'}
            </span>
          </div>
          <button
            onclick={browseSaveDir}
            class="px-3 py-1.5 rounded-lg bg-bg-mute border border-border hover:border-border-hover text-sm text-text-secondary transition-colors shrink-0"
          >
            Browse
          </button>
        </div>
      </div>
    </section>

    <!-- Shortcuts -->
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">Shortcuts</h2>

      <div class="space-y-3">
        {#each [
          { key: 'toggleRecord' as const, label: 'Toggle Recording' },
          { key: 'togglePause' as const, label: 'Toggle Pause' },
          { key: 'cancelRecord' as const, label: 'Cancel Recording' }
        ] as shortcut}
          <div class="flex items-center justify-between">
            <span class="text-sm text-text-secondary">{shortcut.label}</span>
            <kbd class="px-2.5 py-1 rounded-md bg-bg-mute border border-border text-xs text-text-secondary font-mono">
              {settings.current.globalShortcuts[shortcut.key]}
            </kbd>
          </div>
        {/each}
      </div>
    </section>

    <!-- General -->
    <section class="space-y-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">General</h2>

      <div class="flex items-center justify-between">
        <span class="text-sm text-text-secondary">Launch on login</span>
        <Switch.Root
          checked={settings.current.launchOnLogin}
          onCheckedChange={toggleLaunchOnLogin}
          class="w-10 h-6 rounded-full relative transition-colors data-[state=checked]:bg-accent bg-bg-mute border border-border"
        >
          <Switch.Thumb class="block w-4 h-4 rounded-full bg-text-primary shadow transition-transform translate-x-1 data-[state=checked]:translate-x-[18px]" />
        </Switch.Root>
      </div>
    </section>
  </div>
</div>
