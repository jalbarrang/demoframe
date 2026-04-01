<script lang="ts">
  import { push } from 'svelte-spa-router'
  import { getRecording } from '../lib/stores/recording.svelte'
  import { getSettings } from '../lib/stores/settings.svelte'
  import { formatDuration } from '../lib/format-utils'

  const recording = getRecording()
  const settings = getSettings()

  let micMuted = $state(false)

  function togglePause() {
    if (recording.isPaused) {
      recording.resumeRecording()
    } else {
      recording.pauseRecording()
    }
  }

  function stop() {
    recording.stopRecording()
  }

  function cancel() {
    recording.cancelRecording()
  }

  $effect(() => {
    if (recording.state === 'complete') {
      push('/post-recording')
    } else if (recording.state === 'cancelled' || recording.state === 'error') {
      push('/')
    }
  })

  let cleanup: (() => void) | undefined
  $effect(() => {
    cleanup = recording.setupListeners()
    return () => cleanup?.()
  })
</script>

<div
  class="flex items-center gap-2 h-full px-3 bg-bg-soft/95 backdrop-blur-md rounded-2xl border border-border select-none"
  style="-webkit-app-region: drag"
>
  <!-- Recording indicator + timer -->
  <div class="flex items-center gap-2 mr-1" style="-webkit-app-region: no-drag">
    <div class="w-2.5 h-2.5 rounded-full {recording.isPaused ? 'bg-warning' : 'bg-accent animate-pulse'}"></div>
    <span class="text-sm font-mono tabular-nums text-text-primary min-w-[52px]">
      {formatDuration(recording.elapsedMs)}
    </span>
  </div>

  <div class="w-px h-5 bg-border"></div>

  <!-- Pause/Resume -->
  <button
    onclick={togglePause}
    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-mute text-text-secondary hover:text-text-primary transition-colors"
    style="-webkit-app-region: no-drag"
    title={recording.isPaused ? 'Resume' : 'Pause'}
  >
    {#if recording.isPaused}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    {:else}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    {/if}
  </button>

  <!-- Stop -->
  <button
    onclick={stop}
    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/20 text-accent transition-colors"
    style="-webkit-app-region: no-drag"
    title="Stop recording"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  </button>

  <!-- Mic toggle -->
  {#if settings.current.microphoneEnabled}
    <button
      onclick={() => (micMuted = !micMuted)}
      class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-mute transition-colors
        {micMuted ? 'text-text-muted' : 'text-text-secondary hover:text-text-primary'}"
      style="-webkit-app-region: no-drag"
      title={micMuted ? 'Unmute mic' : 'Mute mic'}
    >
      {#if micMuted}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.5-.36 2.18" />
          <path d="M12 19v4M8 23h8" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
        </svg>
      {/if}
    </button>
  {/if}

  <div class="w-px h-5 bg-border"></div>

  <!-- Cancel -->
  <button
    onclick={cancel}
    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
    style="-webkit-app-region: no-drag"
    title="Cancel recording"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  </button>
</div>
