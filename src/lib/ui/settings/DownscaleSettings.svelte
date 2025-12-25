<script lang="ts">
  import ToggleSetting from '../ToggleSetting.svelte'
  import type { PassSettingsBase } from '../../cv/passes/PassSettingsBase'

  export let settings: PassSettingsBase
  export let required: boolean = false

  let enabled = settings.enabled

  $: if (settings) {
    enabled = settings.enabled
  }

  function setEnabled(value: boolean): void {
    enabled = value
    settings.enabled = value
  }
</script>

<div class="settings">
  {#if !required}
    <ToggleSetting label="Enabled" checked={enabled} on:change={(e) => setEnabled(e.detail.checked)} />
  {/if}
  <div class="settingsEmpty">Downscale crops to a square and downsamples before structure.</div>
</div>
