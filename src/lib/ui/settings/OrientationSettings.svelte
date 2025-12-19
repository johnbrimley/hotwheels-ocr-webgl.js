<script lang="ts">
  import ToggleSetting from '../ToggleSetting.svelte'
  import type { OrientationPassSettings } from '../../cv/passes/orientation/OrientationPassSettings'

  export let settings: OrientationPassSettings
  export let required: boolean = false

  let enabled = settings.enabled
  let flipX = settings.flipX
  let flipY = settings.flipY

  $: if (settings) {
    enabled = settings.enabled
    flipX = settings.flipX
    flipY = settings.flipY
  }

  function setEnabled(value: boolean): void {
    enabled = value
    settings.enabled = value
  }
  function setFlipX(value: boolean): void {
    flipX = value
    settings.flipX = value
  }
  function setFlipY(value: boolean): void {
    flipY = value
    settings.flipY = value
  }
</script>

<div class="settings">
  {#if !required}
    <ToggleSetting label="Enabled" checked={enabled} on:change={(e) => setEnabled(e.detail.checked)} />
  {/if}
  <ToggleSetting label="Flip X" checked={flipX} on:change={(e) => setFlipX(e.detail.checked)} />
  <ToggleSetting label="Flip Y" checked={flipY} on:change={(e) => setFlipY(e.detail.checked)} />
</div>

