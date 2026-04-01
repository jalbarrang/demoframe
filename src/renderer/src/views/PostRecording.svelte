<script lang="ts">
  import { push } from 'svelte-spa-router'
  import { getRecording } from '../lib/stores/recording.svelte'
  import { formatDuration, formatFileSize, formatTimestamp } from '../lib/format-utils'
  import { ipc } from '../lib/ipc'

  const recording = getRecording()

  let meta = $derived(recording.lastMeta)

  function openFile() {
    if (meta) ipc.invoke('library:open-file', { path: meta.path })
  }

  function openFolder() {
    if (meta) ipc.invoke('library:open-folder', { path: meta.path })
  }

  function recordAnother() {
    recording.reset()
    push('/source-picker')
  }

  function goToLibrary() {
    recording.reset()
    push('/')
  }
</script>

<div class="flex-1 flex flex-col items-center justify-center p-8">
  <div class="w-full max-w-lg">
    {#if meta}
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center mx-auto mb-3 text-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-text-primary">Recording Complete</h1>
      </div>

      <!-- Preview -->
      <div class="rounded-xl overflow-hidden bg-bg-mute border border-border mb-6">
        <div class="aspect-video bg-bg-elevated relative">
          {#if meta.thumbnailPath}
            <img
              src="file://{meta.thumbnailPath}"
              alt={meta.filename}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center text-text-muted">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
          {/if}

          <span class="absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-medium bg-black/70 text-white tabular-nums">
            {formatDuration(meta.durationMs)}
          </span>
        </div>

        <div class="px-4 py-3 space-y-1.5">
          <p class="text-sm font-medium text-text-primary truncate">{meta.filename}</p>
          <div class="flex items-center gap-3 text-xs text-text-muted">
            <span class="uppercase font-semibold tracking-wide">{meta.format}</span>
            <span>{formatFileSize(meta.fileSize)}</span>
            <span>{meta.resolution.width}×{meta.resolution.height}</span>
            <span>{formatTimestamp(meta.createdAt)}</span>
          </div>
          <p class="text-xs text-text-muted truncate">{meta.path}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          onclick={openFile}
          class="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          Open in Finder
        </button>
        <button
          onclick={openFolder}
          class="py-2.5 px-4 rounded-lg bg-bg-mute border border-border hover:border-border-hover text-sm text-text-secondary transition-colors"
        >
          Open Folder
        </button>
      </div>

      <div class="flex justify-center gap-4 mt-4">
        <button onclick={recordAnother} class="text-sm text-accent hover:underline">Record Another</button>
        <button onclick={goToLibrary} class="text-sm text-text-muted hover:text-text-secondary">Go to Library</button>
      </div>
    {:else}
      <div class="text-center">
        <p class="text-text-secondary">No recording data available.</p>
        <button onclick={goToLibrary} class="mt-4 text-sm text-accent hover:underline">Go to Library</button>
      </div>
    {/if}
  </div>
</div>
