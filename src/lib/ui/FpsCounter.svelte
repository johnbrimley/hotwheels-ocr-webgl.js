<script lang="ts">
  let fps = 0
  let frameCount = 0
  let lastSample = performance.now()

  export function measure(): void {
    const now = performance.now()
    frameCount += 1
    const elapsed = now - lastSample
    if (elapsed >= 500) {
      fps = Math.round((frameCount * 1000) / elapsed)
      frameCount = 0
      lastSample = now
    }
  }
</script>

<div class="fpsBadge" aria-label="Frames per second">{fps} fps</div>

<style>
  .fpsBadge {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(0, 0, 0, 0.5);
    color: rgba(255, 255, 255, 0.92);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    z-index: 10;
  }
</style>
