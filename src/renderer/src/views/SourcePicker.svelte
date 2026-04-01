<script lang="ts">
  import { push } from 'svelte-spa-router'
  import type { SourceInfo, RecordingConfig } from '../../../shared/ipc-channels'
  import { ipc } from '../lib/ipc'
  import { getSettings } from '../lib/stores/settings.svelte'
  import { getRecording } from '../lib/stores/recording.svelte'
  import CountdownOverlay from '../components/CountdownOverlay.svelte'

  const settings = getSettings()
  const recording = getRecording()

  let sources = $state<SourceInfo[]>([])
  let loading = $state(true)
  let selectedId = $state<string | null>(null)
  let showCountdown = $state(false)

  async function loadSources() {
    try {
      sources = await ipc.invoke('sources:list', { types: ['screen'] })
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadSources()
  })

  function selectSource(source: SourceInfo) {
    selectedId = source.id

    if (settings.current.countdownSeconds > 0) {
      showCountdown = true
    } else {
      beginRecording(source.id)
    }
  }

  function onCountdownComplete() {
    showCountdown = false
    if (selectedId) beginRecording(selectedId)
  }

  function beginRecording(sourceId: string) {
    const s = settings.current
    const resolution =
      typeof s.resolution === 'object'
        ? s.resolution
        : { width: window.screen.width, height: window.screen.height }

    const config: RecordingConfig = {
      sourceId,
      resolution,
      frameRate: s.frameRate,
      audioDeviceId: s.microphoneEnabled ? s.microphoneDeviceId : null,
      outputFormat: s.defaultFormat
    }

    recording.startRecording(config)
    push('/recording-bar')
  }
</script>

{#if showCountdown}
  <CountdownOverlay seconds={settings.current.countdownSeconds} onComplete={onCountdownComplete} />
{/if}

<div class="flex-1 flex flex-col min-h-0">
  <header class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
    <h1 class="text-lg font-semibold text-text-primary">Choose a Source</h1>
    <button
      onclick={() => push('/')}
      class="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-mute transition-colors"
    >
      Cancel
    </button>
  </header>

  <div class="flex-1 overflow-y-auto p-6">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if sources.length === 0}
      <div class="flex flex-col items-center justify-center h-full gap-3 text-center">
        <p class="text-text-secondary">No screens available</p>
        <p class="text-sm text-text-muted">Make sure screen recording permission is granted</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-4">
        {#each sources as source (source.id)}
          <button
            onclick={() => selectSource(source)}
            class="group rounded-xl overflow-hidden bg-bg-mute border-2 transition-all cursor-pointer text-left
              {selectedId === source.id ? 'border-accent' : 'border-border hover:border-border-hover'}"
          >
            <div class="aspect-video bg-bg-elevated overflow-hidden">
              {#if source.thumbnail}
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-text-muted">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
              {/if}
            </div>
            <div class="px-3 py-2.5">
              <p class="text-sm text-text-primary truncate">{source.name}</p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
