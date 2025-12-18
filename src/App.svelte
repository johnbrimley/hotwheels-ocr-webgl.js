<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { ComputerVisionPipeline } from './lib/cv/ComputerVisionPipeline'
  import { ImageCaptureContext } from './lib/cv/ImageCaptureContext'
  import { BilateralPass } from './lib/cv/passes/bilateral/BilateralPass'
  import { BilateralPassSettings } from './lib/cv/passes/bilateral/BilateralPassSettings'
  import { Rec709LumPass } from './lib/cv/passes/rec-709-luma/Rec709LumaPass'
  import PassSettingsPanel from './lib/ui/PassSettingsPanel.svelte'
  import PassTabs from './lib/ui/PassTabs.svelte'

  type InputOption = { id: string; label: string }

  type PassDefinition = {
    id: string
    label: string
    required: boolean
    create: (gl: WebGL2RenderingContext) => unknown
    controls: {
      key: string
      label: string
      min: number
      max: number
      step: number
      defaultValue: number
    }[]
  }

  type PassControlState = PassDefinition['controls'][number] & { value: number }
  type PassUiState = { enabled: boolean; controls: PassControlState[] }

  const passDefinitions: PassDefinition[] = [
    {
      id: 'rec709-luma',
      label: 'Rec709 Luma',
      required: true,
      create: (gl) => new Rec709LumPass(gl),
      controls: [],
    },
    {
      id: 'bilateral',
      label: 'Bilateral',
      required: false,
      create: (gl) => {
        const settings = new BilateralPassSettings()
        settings.kernelRadius = 2
        settings.sigmaSpatial = 2.0
        settings.sigmaRange = 0.1
        return new BilateralPass(gl, settings)
      },
      controls: [
        { key: 'u_kernelRadius', label: 'Kernel Radius', min: 1, max: 5, step: 1, defaultValue: 2 },
        { key: 'u_sigmaSpatial', label: 'Sigma Spatial', min: 0.5, max: 10, step: 0.25, defaultValue: 2.0 },
        { key: 'u_sigmaRange', label: 'Sigma Range', min: 0.01, max: 0.5, step: 0.01, defaultValue: 0.1 },
      ],
    },
  ]

  let selectedPassId: string = passDefinitions[0]?.id ?? ''

  let inputContexts: Map<string, ImageCaptureContext> = new Map()
  let inputOptions: InputOption[] = []

  let selectedFrontInputId = ''
  let selectedRearInputId = ''

  let frontCanvas: HTMLCanvasElement | null = null
  let rearCanvas: HTMLCanvasElement | null = null

  let frontPipeline: ComputerVisionPipeline | null = null
  let rearPipeline: ComputerVisionPipeline | null = null

  let frontPasses: unknown[] = []
  let rearPasses: unknown[] = []

  let passUiStateById: Record<string, PassUiState> = Object.fromEntries(
    passDefinitions.map((pass) => [
      pass.id,
      {
        enabled: true,
        controls: pass.controls.map((c) => ({ ...c, value: c.defaultValue })),
      },
    ])
  ) as Record<string, PassUiState>

  let errorMessage: string | null = null
  let running = false
  let frameInFlight = false

  function refreshInputOptions(): void {
    inputOptions = Array.from(inputContexts.entries()).map(([id, ctx]) => ({
      id,
      label: `${ctx.mediaStreamTrack.label || 'Camera'} (${id})`,
    }))
  }

  async function initializeInputs(): Promise<void> {
    await ImageCaptureContext.initialize()
    inputContexts = ImageCaptureContext.imageCaptureContexts
    refreshInputOptions()

    if (!selectedFrontInputId && inputOptions[0]) selectedFrontInputId = inputOptions[0].id
    if (!selectedRearInputId && inputOptions[1]) selectedRearInputId = inputOptions[1].id
    if (!selectedRearInputId && inputOptions[0]) selectedRearInputId = inputOptions[0].id
  }

  function buildPipeline(gl: WebGL2RenderingContext): { pipeline: ComputerVisionPipeline; passes: unknown[] } {
    const pipeline = new ComputerVisionPipeline(gl)
    const passes = passDefinitions.map((p) => p.create(gl))
    for (const pass of passes) {
      pipeline.addPass(pass as any)
    }
    return { pipeline, passes }
  }

  function applyControlsToPipelines(passId: string): void {
    const passIndex = passDefinitions.findIndex((p) => p.id === passId)
    if (passIndex < 0) return

    const uiState = passUiStateById[passId]
    const controls = uiState?.controls ?? []

    const applyToPass = (pass: any) => {
      if (typeof uiState?.enabled === 'boolean') {
        pass.enabled = uiState.enabled
        if (pass.settings && typeof pass.settings.enabled === 'boolean') {
          pass.settings.enabled = uiState.enabled
        }
      }
      for (const control of controls) {
        pass.settings.uniforms[control.key] = control.value
      }
    }

    if (frontPasses[passIndex]) applyToPass(frontPasses[passIndex])
    if (rearPasses[passIndex]) applyToPass(rearPasses[passIndex])
  }

  function setPassEnabled(passId: string, enabled: boolean): void {
    const passDef = passDefinitions.find((p) => p.id === passId)
    if (!passDef || passDef.required) return

    passUiStateById = {
      ...passUiStateById,
      [passId]: { ...passUiStateById[passId], enabled },
    }
    applyControlsToPipelines(passId)
  }

  function setControlValue(passId: string, controlKey: string, value: number): void {
    const uiState = passUiStateById[passId]
    const controls = uiState?.controls ?? []
    passUiStateById = {
      ...passUiStateById,
      [passId]: { ...uiState, controls: controls.map((c) => (c.key === controlKey ? { ...c, value } : c)) },
    }
    applyControlsToPipelines(passId)
  }

  async function renderSelected(pipeline: ComputerVisionPipeline | null, inputId: string): Promise<void> {
    if (!pipeline || !inputId) return
    const ctx = inputContexts.get(inputId)
    if (!ctx) return

    const bitmap = (await (ctx.imageCapture as any).grabFrame()) as ImageBitmap
    try {
      await pipeline.render(bitmap)
    } finally {
      bitmap.close()
    }
  }

  async function loop(): Promise<void> {
    if (!running) return
    if (frameInFlight) {
      requestAnimationFrame(() => void loop())
      return
    }

    frameInFlight = true
    try {
      await renderSelected(frontPipeline, selectedFrontInputId)
      await renderSelected(rearPipeline, selectedRearInputId)
      errorMessage = null
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err)
    } finally {
      frameInFlight = false
      requestAnimationFrame(() => void loop())
    }
  }

  onMount(async () => {
    try {
      await initializeInputs()

      const frontGl = frontCanvas?.getContext('webgl2')
      const rearGl = rearCanvas?.getContext('webgl2')

      if (!frontGl || !rearGl) {
        errorMessage = 'WebGL2 not available for one or both canvases.'
        return
      }

      const front = buildPipeline(frontGl)
      frontPipeline = front.pipeline
      frontPasses = front.passes

      const rear = buildPipeline(rearGl)
      rearPipeline = rear.pipeline
      rearPasses = rear.passes

      for (const pass of passDefinitions) {
        applyControlsToPipelines(pass.id)
      }

      running = true
      void loop()
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err)
    }
  })

  onDestroy(() => {
    running = false
  })
</script>

<main class="app">
  <section class="controls">
    <PassTabs
      passes={passDefinitions.map((p) => ({ id: p.id, label: p.label }))}
      {selectedPassId}
      on:select={(e) => (selectedPassId = e.detail.passId)}
    />

    {#if selectedPassId}
      {@const passDef = passDefinitions.find((p) => p.id === selectedPassId)}
      {@const uiState = passUiStateById[selectedPassId]}
      {#if passDef && uiState}
        <PassSettingsPanel
          required={passDef.required}
          enabled={uiState.enabled}
          controls={uiState.controls.map((c) => ({ ...c, kind: 'slider' as const }))}
          onEnabledChange={(enabled) => setPassEnabled(selectedPassId, enabled)}
          onControlChange={(key, value) => setControlValue(selectedPassId, key, value)}
        />
      {/if}
    {/if}
  </section>

  <section class="views">
    <div class="cameraPanel">
      <div class="cameraHeader">
        <div class="cameraTitle">Front</div>
        <select class="cameraSelect" bind:value={selectedFrontInputId}>
          <option value="" disabled>Select input…</option>
          {#each inputOptions as opt (opt.id)}
            <option value={opt.id}>{opt.id}</option>
          {/each}
        </select>
      </div>
      <canvas class="cameraCanvas" bind:this={frontCanvas}></canvas>
    </div>

    <div class="cameraPanel">
      <div class="cameraHeader">
        <div class="cameraTitle">Rear</div>
        <select class="cameraSelect" bind:value={selectedRearInputId}>
          <option value="" disabled>Select input…</option>
          {#each inputOptions as opt (opt.id)}
            <option value={opt.id}>{opt.id}</option>
          {/each}
        </select>
      </div>
      <canvas class="cameraCanvas" bind:this={rearCanvas}></canvas>
    </div>
  </section>

  {#if errorMessage}
    <div class="errorBanner" role="alert">{errorMessage}</div>
  {/if}
</main>

  <style>
  .app {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .controls {
    flex: 0 0 auto;
    max-height: 33vh;
    overflow: auto;
    padding: 12px 12px 0 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  :global(.passBar) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  :global(.passButton) {
    background: #1b1b1b;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-bottom-color: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 8px 12px;
    line-height: 1;
    box-shadow:
      0 3px 0 rgba(0, 0, 0, 0.65),
      0 6px 20px rgba(0, 0, 0, 0.35);
    transition:
      transform 80ms ease,
      box-shadow 80ms ease,
      background-color 120ms ease,
      border-color 120ms ease;
  }

  :global(.passButtonActive) {
    transform: translateY(3px);
    box-shadow:
      0 0px 0 rgba(0, 0, 0, 0.65),
      0 3px 12px rgba(0, 0, 0, 0.35);
    background: #232323;
    border-color: rgba(255, 255, 255, 0.22);
  }

  :global(.settings) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  :global(.settingsEmpty) {
    opacity: 0.7;
    padding: 4px 0 12px 0;
  }

  :global(.setting) {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 220px;
    max-width: 320px;
  }

  :global(.settingLabel) {
    font-size: 12px;
    opacity: 0.8;
  }

  :global(.settingControl) {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  :global(.settingControl input[type='range']) {
    flex: 1 1 auto;
  }

  :global(.settingValue) {
    width: 64px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    opacity: 0.9;
  }

  .views {
    flex: 1 1 auto;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 0 12px 12px 12px;
  }

  .cameraPanel {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cameraHeader {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cameraTitle {
    font-weight: 600;
  }

  .cameraSelect {
    flex: 1 1 auto;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
  }

  .cameraCanvas {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
    background: #0d0d0d;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .errorBanner {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(120, 15, 15, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(6px);
  }
</style>
