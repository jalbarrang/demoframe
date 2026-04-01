<script lang="ts">
  let { seconds, onComplete }: { seconds: number; onComplete: () => void } = $props()

  let count = $state(seconds)

  $effect(() => {
    if (count <= 0) {
      onComplete()
      return undefined
    }
    const timeout = setTimeout(() => {
      count--
    }, 1000)
    return () => clearTimeout(timeout)
  })
</script>

{#if count > 0}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="relative">
      <span
        class="text-[120px] font-bold text-white tabular-nums select-none animate-pulse"
        style="text-shadow: 0 0 40px rgba(239, 68, 68, 0.5)"
      >
        {count}
      </span>
    </div>
  </div>
{/if}
