<script lang="ts">
  import type { RecordingMeta } from '../../../shared/ipc-channels'
  import { formatDuration, formatFileSize } from '../lib/format-utils'
  import { ipc } from '../lib/ipc'

  let { recording }: { recording: RecordingMeta } = $props()

  let hovering = $state(false)

  function openFile() {
    ipc.invoke('library:open-file', { path: recording.path })
  }

  function openFolder() {
    ipc.invoke('library:open-folder', { path: recording.path })
  }

  async function deleteRecording(e: MouseEvent) {
    e.stopPropagation()
    await ipc.invoke('library:delete', { id: recording.id })
  }
</script>

<div
  role="button"
  tabindex="0"
  class="group relative rounded-xl overflow-hidden bg-bg-mute border border-border hover:border-border-hover transition-all cursor-pointer text-left"
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => (hovering = false)}
  onclick={openFile}
  onkeydown={(e) => { if (e.key === 'Enter') openFile() }}
>
  <div class="aspect-video bg-bg-elevated relative overflow-hidden">
    {#if recording.thumbnailPath}
      <img
        src="file://{recording.thumbnailPath}"
        alt={recording.filename}
        class="w-full h-full object-cover"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-text-muted">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </div>
    {/if}

    <span class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-medium bg-black/70 text-white tabular-nums">
      {formatDuration(recording.durationMs)}
    </span>

    <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-bg-elevated/80 text-text-secondary">
      {recording.format}
    </span>

    {#if hovering}
      <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
        <button
          onclick={(e) => { e.stopPropagation(); openFolder() }}
          class="p-2 rounded-lg bg-bg-elevated/90 text-text-primary hover:bg-bg-mute transition-colors"
          title="Open Folder"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button
          onclick={deleteRecording}
          class="p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <div class="px-3 py-2.5">
    <p class="text-sm text-text-primary truncate">{recording.filename}</p>
    <p class="text-xs text-text-muted mt-0.5">{formatFileSize(recording.fileSize)}</p>
  </div>
</div>
