<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  type PassTab = { id: string; label: string }

  export let passes: PassTab[] = []
  export let selectedPassId: string

  const dispatch = createEventDispatcher<{ select: { passId: string } }>()
</script>

<div class="passBar" role="tablist" aria-label="Pipeline passes">
  {#each passes as pass (pass.id)}
    <button
      type="button"
      class="passButton"
      class:passButtonActive={selectedPassId === pass.id}
      role="tab"
      aria-selected={selectedPassId === pass.id}
      on:click={() => dispatch('select', { passId: pass.id })}
    >
      {pass.label}
    </button>
  {/each}
</div>
