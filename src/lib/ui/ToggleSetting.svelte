<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let label: string
  export let checked: boolean

  const dispatch = createEventDispatcher<{ change: { checked: boolean } }>()
</script>

<label class="setting toggleSetting">
  <div class="settingLabel">{label}</div>
  <div class="settingControl">
    <input
      type="checkbox"
      checked={checked}
      on:change={(e) => dispatch('change', { checked: (e.currentTarget as HTMLInputElement).checked })}
    />
  </div>
</label>

