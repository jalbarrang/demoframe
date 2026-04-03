<script lang="ts">
  import { getUpdates } from '../lib/stores/updates.svelte'

  const updates = getUpdates()

  let visible = $derived(
    updates.status.state === 'available' ||
      updates.status.state === 'downloading' ||
      updates.status.state === 'downloaded'
  )

  let title = $derived.by(() => {
    if (updates.status.state === 'downloaded') return 'Update ready to install'
    if (updates.status.state === 'downloading') return 'Downloading update'
    return 'Update available'
  })

  let description = $derived.by(() => {
    const version = updates.status.availableVersion
    if (updates.status.state === 'downloaded') {
      return version ? `DemoFrame ${version} is ready. Restart to install it.` : 'Restart to install the latest update.'
    }
    if (updates.status.state === 'downloading') {
      if (version && updates.status.progressPercent != null) {
        return `Downloading DemoFrame ${version} — ${updates.status.progressPercent}%`
      }
      if (updates.status.progressPercent != null) {
        return `Downloading the latest update — ${updates.status.progressPercent}%`
      }
      return 'Downloading the latest update in the background.'
    }
    return version ? `DemoFrame ${version} is downloading in the background.` : 'A new version is downloading in the background.'
  })

  async function restartToInstall() {
    await updates.quitAndInstall()
  }
</script>

{#if visible}
  <div class="border-b border-border bg-bg-soft px-6 py-3">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-text-primary">{title}</p>
        <p class="mt-1 text-xs text-text-secondary">{description}</p>
      </div>

      {#if updates.status.state === 'downloaded'}
        <button
          onclick={restartToInstall}
          class="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Restart to install
        </button>
      {/if}
    </div>
  </div>
{/if}
