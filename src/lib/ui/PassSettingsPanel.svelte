<script lang="ts">
  import SliderSetting from './SliderSetting.svelte'
  import ToggleSetting from './ToggleSetting.svelte'

  type SliderControl = {
    kind: 'slider'
    key: string
    label: string
    min: number
    max: number
    step: number
    value: number
  }

  export let required: boolean = false
  export let enabled: boolean = true
  export let controls: SliderControl[] = []

  export let onEnabledChange: (enabled: boolean) => void
  export let onControlChange: (key: string, value: number) => void
</script>

<div class="settings" aria-label="Pass settings">
  {#if !required}
    <ToggleSetting label="Enabled" checked={enabled} on:change={(e) => onEnabledChange(e.detail.checked)} />
  {/if}

  {#if controls.length > 0}
    {#each controls as control (control.key)}
      <SliderSetting
        label={control.label}
        min={control.min}
        max={control.max}
        step={control.step}
        value={control.value}
        on:input={(e) => onControlChange(control.key, e.detail.value)}
      />
    {/each}
  {:else}
    <div class="settingsEmpty">No settings for this pass.</div>
  {/if}
</div>
