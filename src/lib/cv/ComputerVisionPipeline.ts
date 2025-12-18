import type { PassBase } from "./passes/PassBase";
import { RenderTarget2D } from "./RenderTarget2D";

export class ComputerVisionPipeline {
    private passes: PassBase[] = [];
    private bitmapRenderTarget: RenderTarget2D;
    constructor(public gl: WebGL2RenderingContext) {
        this.bitmapRenderTarget = RenderTarget2D.createRGBA8(gl);
    }

    addPass(pass: PassBase): void {
        this.passes.push(pass);
    }

    applyBitmap(texture: WebGLTexture, bitmap: ImageBitmap): void {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D,
            0,
            0,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            bitmap
        );
    }

    resize(width: number, height: number): void {
        this.gl.canvas.width = width;
        this.gl.canvas.height = height;
        this.bitmapRenderTarget.resize(width, height);
    }

    async render(bitmap: ImageBitmap): Promise<void> {
        if (this.gl.canvas.width !== bitmap.width || this.gl.canvas.height !== bitmap.height) {
            this.resize(bitmap.width, bitmap.height);
        }

        this.applyBitmap(this.bitmapRenderTarget.texture, bitmap);

        const enabeledPasses = this.passes.filter(p => p.enabled);

        if (enabeledPasses.length === 0) {
            throw new Error('No passes in pipeline');
        }

        let renderTarget: RenderTarget2D = this.bitmapRenderTarget;
        for (let i = 0; i < enabeledPasses.length - 1; i++) {
            const pass = enabeledPasses[i];
            renderTarget = pass.apply(renderTarget);
        }
        const finalPass = enabeledPasses[enabeledPasses.length - 1];
        finalPass.applyToScreen(renderTarget);
    }
}