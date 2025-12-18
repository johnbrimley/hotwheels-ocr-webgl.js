<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let label: string
  export let min: number
  export let max: number
  export let step: number
  export let value: number

  const dispatch = createEventDispatcher<{ input: { value: number } }>()
</script>

<label class="setting">
  <div class="settingLabel">{label}</div>
  <div class="settingControl sliderControl">
    <div class="sliderShell">
      <div class="sliderTrack">
        <input
          class="sliderInput"
          type="range"
          {min}
          {max}
          {step}
          {value}
          on:input={(e) => dispatch('input', { value: Number((e.currentTarget as HTMLInputElement).value) })}
        />
      </div>
      <div class="settingValue">{value}</div>
    </div>
  </div>
</label>

<style>
  .sliderControl {
    align-items: stretch;
  }

  .sliderShell {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.25));
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.1),
      0 4px 10px rgba(0, 0, 0, 0.35);
    align-items: center;
  }

  .sliderTrack {
    flex: 1 1 auto;
  }

  .sliderInput {
    width: 100%;
    background: transparent;
  }

  .settingValue {
    width: 64px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    opacity: 0.95;
  }
</style>
