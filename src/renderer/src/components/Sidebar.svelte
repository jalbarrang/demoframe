<script lang="ts">
  import { push, router } from 'svelte-spa-router'

  const nav = [
    {
      path: '/',
      label: 'Library',
      icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z'
    },
    {
      path: '/source-picker',
      label: 'Record',
      icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: 'M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53a7.76 7.76 0 0 0 .07-1 7.76 7.76 0 0 0-.07-.97l2.11-1.63a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.15 7.15 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65a7.15 7.15 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11a7.76 7.76 0 0 0-.07.97 7.76 7.76 0 0 0 .07 1l-2.11 1.63a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.72 1.69.98l.38 2.65c.05.24.26.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65a7.15 7.15 0 0 0 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.66z'
    }
  ]
</script>

<nav class="flex flex-col items-center w-14 shrink-0 bg-bg-soft border-r border-border py-4 gap-1">
  <div class="mb-4 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  </div>

  {#each nav as item}
    {@const active = router.location === item.path || (router.location === '/' && item.path === '/')}
    <button
      onclick={() => push(item.path)}
      class="relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors
        {active ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-secondary hover:bg-bg-mute'}"
      title={item.label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d={item.icon} />
      </svg>
    </button>
  {/each}
</nav>
