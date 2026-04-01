<script lang="ts">
  let {
    title,
    description,
    icon,
    granted,
    buttonLabel,
    onRequest
  }: {
    title: string
    description: string
    icon: string
    granted: boolean
    buttonLabel: string
    onRequest: () => void
  } = $props()
</script>

<div class="flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
  <div class="w-16 h-16 rounded-2xl flex items-center justify-center
    {granted ? 'bg-success/15 text-success' : 'bg-accent-soft text-accent'}">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      {#if granted}
        <path d="M20 6L9 17l-5-5" />
      {:else}
        <path d={icon} />
      {/if}
    </svg>
  </div>

  <div>
    <h3 class="text-lg font-semibold text-text-primary">{title}</h3>
    <p class="text-sm text-text-secondary mt-1">{description}</p>
  </div>

  {#if !granted}
    <button
      onclick={onRequest}
      class="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
    >
      {buttonLabel}
    </button>
  {:else}
    <span class="px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium">
      Granted
    </span>
  {/if}
</div>
