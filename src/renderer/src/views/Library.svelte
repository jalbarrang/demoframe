<script lang="ts">
  import { push } from 'svelte-spa-router'
  import type { RecordingMeta } from '../../../shared/ipc-channels'
  import { ipc } from '../lib/ipc'
  import RecordingCard from '../components/RecordingCard.svelte'

  let recordings = $state<RecordingMeta[]>([])
  let loading = $state(true)

  async function load() {
    try {
      recordings = await ipc.invoke('library:list')
    } finally {
      loading = false
    }
  }

  $effect(() => {
    load()
  })
</script>

<div class="flex-1 flex flex-col min-h-0">
  <header class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
    <h1 class="text-lg font-semibold text-text-primary">Library</h1>
    <button
      onclick={() => push('/source-picker')}
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
      </svg>
      New Recording
    </button>
  </header>

  <div class="flex-1 overflow-y-auto p-6">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if recordings.length === 0}
      <div class="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div class="w-20 h-20 rounded-2xl bg-bg-mute flex items-center justify-center text-text-muted">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div>
          <p class="text-text-secondary font-medium">No recordings yet</p>
          <p class="text-sm text-text-muted mt-1">Capture your screen to get started</p>
        </div>
        <button
          onclick={() => push('/source-picker')}
          class="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          Start Recording
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {#each recordings as rec (rec.id)}
          <RecordingCard recording={rec} />
        {/each}
      </div>
    {/if}
  </div>
</div>
