<script lang="ts">
  import { getDevices } from '../lib/stores/devices.svelte'

  let { value = $bindable<string | null>(null) }: { value?: string | null } = $props()

  const devices = getDevices()
  let open = $state(false)

  function select(deviceId: string) {
    value = deviceId
    devices.select(deviceId)
    open = false
  }
</script>

<div class="relative">
  <button
    onclick={() => (open = !open)}
    class="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-mute border border-border hover:border-border-hover text-sm text-text-primary transition-colors text-left"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
    <span class="truncate flex-1">
      {#if devices.isDisconnected}
        <span class="text-warning">Device disconnected</span>
      {:else if devices.selected}
        {devices.selected.label}
      {:else}
        Select microphone…
      {/if}
    </span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0 text-text-muted transition-transform {open ? 'rotate-180' : ''}">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>

  {#if open}
    <div class="absolute z-50 top-full mt-1 left-0 right-0 bg-bg-elevated border border-border rounded-lg py-1 shadow-xl max-h-48 overflow-y-auto">
      {#each devices.list as device}
        <button
          onclick={() => select(device.deviceId)}
          class="w-full px-3 py-2 text-left text-sm hover:bg-bg-mute transition-colors
            {device.deviceId === value ? 'text-accent' : 'text-text-primary'}"
        >
          {device.label}
        </button>
      {:else}
        <p class="px-3 py-2 text-sm text-text-muted">No microphones found</p>
      {/each}
    </div>
  {/if}
</div>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-40" onclick={() => (open = false)} onkeydown={() => {}}></div>
{/if}
