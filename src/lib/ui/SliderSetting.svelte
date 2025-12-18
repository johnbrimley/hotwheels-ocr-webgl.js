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
  <div class="settingControl">
    <input
      type="range"
      {min}
      {max}
      {step}
      {value}
      on:input={(e) => dispatch('input', { value: Number((e.currentTarget as HTMLInputElement).value) })}
    />
    <div class="settingValue">{value}</div>
  </div>
</label>

