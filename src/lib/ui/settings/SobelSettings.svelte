<script lang="ts">
  import SliderSetting from '../SliderSetting.svelte'
  import ToggleSetting from '../ToggleSetting.svelte'
  import type { SobelPassSettings } from '../../cv/passes/sobel/SobelPassSettings'

  export let frontSettings: SobelPassSettings
  export let rearSettings: SobelPassSettings | undefined
  export let required: boolean = false

  let enabled = frontSettings.enabled
  let kernelRadius = frontSettings.kernelRadius
  let directionBias = frontSettings.directionBias
  let edgeGain = frontSettings.edgeGain
  let minEdge = frontSettings.minEdge

  function setEnabled(value: boolean): void {
    enabled = value
    frontSettings.enabled = value
    if (rearSettings) rearSettings.enabled = value
  }

  function setKernelRadius(value: number): void {
    kernelRadius = value
    frontSettings.kernelRadius = value
    if (rearSettings) rearSettings.kernelRadius = value
  }

  function setDirectionBias(value: number): void {
    directionBias = value
    frontSettings.directionBias = value
    if (rearSettings) rearSettings.directionBias = value
  }

  function setEdgeGain(value: number): void {
    edgeGain = value
    frontSettings.edgeGain = value
    if (rearSettings) rearSettings.edgeGain = value
  }

  function setMinEdge(value: number): void {
    minEdge = value
    frontSettings.minEdge = value
    if (rearSettings) rearSettings.minEdge = value
  }
</script>

<div class="settings">
  {#if !required}
    <ToggleSetting label="Enabled" checked={enabled} on:change={(e) => setEnabled(e.detail.checked)} />
  {/if}

  <SliderSetting
    label="Kernel Radius"
    min={1}
    max={2}
    step={1}
    value={kernelRadius}
    on:input={(e) => setKernelRadius(e.detail.value)}
  />
  <SliderSetting
    label="Direction Bias"
    min={-1}
    max={1}
    step={0.1}
    value={directionBias}
    on:input={(e) => setDirectionBias(e.detail.value)}
  />
  <SliderSetting
    label="Edge Gain"
    min={0}
    max={8}
    step={0.1}
    value={edgeGain}
    on:input={(e) => setEdgeGain(e.detail.value)}
  />
  <SliderSetting
    label="Min Edge"
    min={0}
    max={1}
    step={0.01}
    value={minEdge}
    on:input={(e) => setMinEdge(e.detail.value)}
  />
</div>

