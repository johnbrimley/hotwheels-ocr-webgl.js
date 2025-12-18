<script lang="ts">
  import SliderSetting from '../SliderSetting.svelte'
  import ToggleSetting from '../ToggleSetting.svelte'
  import type { RayBoxPassSettings } from '../../cv/passes/ray-box/RayBoxPassSettings'

  export let frontSettings: RayBoxPassSettings
  export let rearSettings: RayBoxPassSettings | undefined
  export let required: boolean = false

  let enabled = frontSettings.enabled
  let threshold = frontSettings.threshold
  let rayCount = frontSettings.rayCount
  let angleThreshold = frontSettings.angleThreshold
  let distanceThreshold = frontSettings.distanceThreshold

  function mirror<T>(fn: (settings: RayBoxPassSettings, value: T) => void, value: T) {
    fn(frontSettings, value)
    if (rearSettings) fn(rearSettings, value)
  }

  function setEnabled(value: boolean): void {
    enabled = value
    mirror((s, v) => (s.enabled = v), value)
  }
  function setThreshold(value: number): void {
    threshold = value
    mirror((s, v) => (s.threshold = v), value)
  }
  function setRayCount(value: number): void {
    rayCount = value
    mirror((s, v) => (s.rayCount = v), value)
  }
  function setAngleThreshold(value: number): void {
    angleThreshold = value
    mirror((s, v) => (s.angleThreshold = v), value)
  }
  function setDistanceThreshold(value: number): void {
    distanceThreshold = value
    mirror((s, v) => (s.distanceThreshold = v), value)
  }
</script>

<div class="settings">
  {#if !required}
    <ToggleSetting label="Enabled" checked={enabled} on:change={(e) => setEnabled(e.detail.checked)} />
  {/if}

  <SliderSetting
    label="Threshold"
    min={0}
    max={0.25}
    step={0.005}
    value={threshold}
    on:input={(e) => setThreshold(e.detail.value)}
  />
  <SliderSetting
    label="Ray Count"
    min={8}
    max={256}
    step={4}
    value={rayCount}
    on:input={(e) => setRayCount(Math.round(e.detail.value))}
  />
  <SliderSetting
    label="Angle Threshold"
    min={0.05}
    max={1.0}
    step={0.01}
    value={angleThreshold}
    on:input={(e) => setAngleThreshold(e.detail.value)}
  />
  <SliderSetting
    label="Distance Threshold"
    min={0.05}
    max={1.0}
    step={0.01}
    value={distanceThreshold}
    on:input={(e) => setDistanceThreshold(e.detail.value)}
  />
</div>

