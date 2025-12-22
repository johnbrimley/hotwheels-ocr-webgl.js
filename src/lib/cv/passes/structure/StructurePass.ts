import * as twgl from 'twgl.js';
import { RenderTarget2D } from '../../RenderTarget2D';
import { PassBase } from '../PassBase';
import type { StructurePassSettings } from './StructurePassSettings';
import sobelGradientsFrag from './sobel-gradients.frag?raw';
import dogFrag from './dog.frag?raw';
import { draw } from 'svelte/transition';
import { type Metadata } from './metadata';
import { Sobel } from '../../models/Sobel';
import { DifferenceOfGaussians } from '../../models/DifferenceOfGaussians';


export class StructurePass extends PassBase {
    private sobelGradientsProgramInfo: twgl.ProgramInfo;
    private sobelGradientsRenderTarget: RenderTarget2D;

    private dogProgramInfo: twgl.ProgramInfo;
    private dogRenderTarget: RenderTarget2D;

    private debugProgramInfo: twgl.ProgramInfo;
    private debugRenderTarget: RenderTarget2D;
    private debugQuadBufferInfo: twgl.BufferInfo;

    private debugFragmentShaderSource =
        `
#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;

out vec4 outColor;

void main() {
outColor = texture(u_input, v_uv);
}
`;

    constructor(gl: WebGL2RenderingContext, private sobelPassSettings: StructurePassSettings) {
        super(gl, sobelPassSettings);

        this.sobelGradientsProgramInfo = this.createProgramInfo(sobelGradientsFrag);
        this.sobelGradientsRenderTarget = RenderTarget2D.createRGBA8(gl);

        this.dogProgramInfo = this.createProgramInfo(dogFrag);
        this.dogRenderTarget = RenderTarget2D.createRGBA8(gl);

        this.debugProgramInfo = this.createProgramInfo(this.debugFragmentShaderSource);
        this.debugRenderTarget = RenderTarget2D.createRGBA8(gl);
        this.debugQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    }

    public applyInternal(renderTargetIn: RenderTarget2D, applyToScreen: boolean): RenderTarget2D {
        if (!renderTargetIn.isR8) {
            throw new Error('SobelPass expects R8 or RGBA8 render targets');
        }
        this.executeProgram(this.sobelGradientsProgramInfo, renderTargetIn, this.sobelGradientsRenderTarget);
        this.executeProgram(this.dogProgramInfo, this.sobelGradientsRenderTarget, this.dogRenderTarget);
        this.followEdge(this.buildMetadata());
        return this.dogRenderTarget;
    }

    private buildMetadata(): Array<Metadata> {
        const gl = this.gl;
        const width = this.dogRenderTarget.framebufferInfo.width;
        const height = this.dogRenderTarget.framebufferInfo.height;
        const sobelData = this.readRGBA8Framebuffer(
            gl,
            this.sobelGradientsRenderTarget.framebufferInfo.framebuffer,
            width,
            height
        );
        const dogData = this.readRGBA8Framebuffer(
            gl,
            this.dogRenderTarget.framebufferInfo.framebuffer,
            width,
            height
        );
        const metadata = new Array<Metadata>(sobelData.length / 4);
        for (let i = 0; i < sobelData.length; i += 4) {
            const index = i / 4;
            metadata[index] = {} as Metadata;
            metadata[index].index = index;
            metadata[index].sobel = new Sobel(sobelData[i], sobelData[i + 1], sobelData[i + 2], sobelData[i + 3]);
            metadata[index].dog = new DifferenceOfGaussians(dogData[i], dogData[i + 1], dogData[i + 2], dogData[i + 3]);
        }
        for (let i = 0; i < dogData.length; i += 4) {

        }
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const centerIndex = y * width + x
                const centerMeta = metadata[centerIndex]
                let strongestScore = -1;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {

                        // Skip center pixel if desired
                        if (dx === 0 && dy === 0) continue

                        const nx = x + dx
                        const ny = y + dy

                        // Bounds check FIRST
                        if (nx < 0 || nx >= width) continue
                        if (ny < 0 || ny >= height) continue

                        const neighborIndex = ny * width + nx

                        const neighborMeta = metadata[neighborIndex]

                        const gradientDot = Math.abs(
                            centerMeta.sobel.gradientVectorX * neighborMeta.sobel.gradientVectorX +
                            centerMeta.sobel.gradientVectorY * neighborMeta.sobel.gradientVectorY
                        )

                        const tangentialDot = Math.abs(
                            dx * -centerMeta.sobel.gradientVectorY +
                            dy * centerMeta.sobel.gradientVectorX
                        )

                        const neighborScore = gradientDot * tangentialDot;

                        if (neighborScore > strongestScore) {
                            strongestScore = neighborScore;
                            centerMeta.secondStrongestNeighborIndex = centerMeta.strongestNeighborIndex;
                            centerMeta.secondStrongestNeighborScore = centerMeta.strongestNeighborScore;
                            centerMeta.strongestNeighborIndex = neighborMeta.index;
                            centerMeta.strongestNeighborScore = neighborScore;
                        }

                        const ux = centerMeta.sobel.gradientVectorX;
                        const uy = centerMeta.sobel.gradientVectorY;

                        const gain = Math.abs(ux) + Math.abs(uy);

                        const normalizedMagnitude =
                            gain > 0 ? centerMeta.sobel.magnitude / gain : 0;

                        centerMeta.score = normalizedMagnitude * strongestScore;
                    }
                }
            }
        }

        // //show max score
        // let maxScore = 0;
        // for (const meta of metadata) {
        //     if (meta.score > maxScore) {
        //         maxScore = meta.score;
        //     }
        // }
        // console.log('StructurePass max score:', maxScore);
        // //create a histogram of scores based on the max score, show bucket values and counts
        // const histogramBuckets = 256;
        // const histogram = new Array<{bucketValue: number, count: number}>(histogramBuckets);
        // for (let i = 0; i < histogramBuckets; i++) {
        //     histogram[i] = {bucketValue: i * (maxScore / histogramBuckets), count: 0};
        // }
        // for (const meta of metadata) {
        //     const bucketIndex = Math.min(histogramBuckets - 1, Math.floor((meta.score / maxScore) * histogramBuckets));
        //     histogram[bucketIndex].count++;
        // }
        // console.log('StructurePass score histogram:', histogram);


        return metadata;
    }

    private readRGBA8Framebuffer(
        gl: WebGL2RenderingContext,
        framebuffer: WebGLFramebuffer,
        width: number,
        height: number
    ): Uint8Array {

        // Allocate CPU buffer
        const pixelData = new Uint8Array(width * height * 4)

        // Bind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

        // Ensure correct pack alignment
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1)

        // Read pixels
        gl.readPixels(
            0,
            0,
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixelData
        )

        // Unbind (optional but good hygiene)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        return pixelData
    }

    private followEdge(
        metadata: Array<Metadata>
    ) {
        const minScore = .3;
        const ordered = metadata.slice().sort((a, b) => b.score - a.score);
        const visited = Array<boolean>(metadata.length).fill(false);
        const luma: Float32Array = new Float32Array(640 * 480);
        let currentMeta = ordered[0];
        let lastIndex: number | null = null;

        for (let i = 0; i < 10000; i++) {
            luma[currentMeta.index] = 1.0;
            visited[currentMeta.index] = true;

            const strongestIndex = currentMeta.strongestNeighborIndex;
            const secondIndex = currentMeta.secondStrongestNeighborIndex;

            const strongest =
                strongestIndex >= 0 && strongestIndex < metadata.length
                    ? metadata[strongestIndex]
                    : null;

            const second =
                secondIndex >= 0 && secondIndex < metadata.length
                    ? metadata[secondIndex]
                    : null;

            let next: Metadata | null = null;

            if (strongest && strongest.index !== lastIndex && !visited[strongest.index] && strongest.score >= minScore) {
                next = strongest;
            } else if (second && second.index !== lastIndex && !visited[second.index] && second.score >= minScore) {
                next = second;
            } else {
                // Find next unvisited with highest score
                next = null;
                for (const candidate of ordered) {
                    if (!visited[candidate.index] && candidate.score >= minScore) {
                        next = candidate;
                        break;
                    }
                }
            }

            if (!next) {
                break;
            }
            lastIndex = currentMeta.index;
            currentMeta = next;
        }

        this.drawLumaArray(this.gl, this.debugProgramInfo, this.debugRenderTarget, luma);
    }

    private drawLumaArray(
        gl: WebGLRenderingContext,
        programInfo: twgl.ProgramInfo,
        renderTarget: RenderTarget2D,
        luma: Float32Array | number[]
    ) {
        // 1. Convert luma → RGBA (Uint8)
        const WIDTH = 640;
        const HEIGHT = 480;
        const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

        for (let i = 0; i < WIDTH * HEIGHT; i++) {
            const v = Math.max(0, Math.min(1, luma[i])) * 255;
            const o = i * 4;
            rgba[o + 0] = v; // R
            rgba[o + 1] = v; // G
            rgba[o + 2] = v; // B
            rgba[o + 3] = 255; // A
        }

        // 2. Create or update texture
        gl.bindTexture(gl.TEXTURE_2D, renderTarget.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            WIDTH,
            HEIGHT,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            rgba
        );

        // 3. Bind framebuffer (null = screen)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, WIDTH, HEIGHT);

        // 4. Draw fullscreen quad
        gl.useProgram(programInfo.program);

        twgl.setBuffersAndAttributes(gl, programInfo, this.quadBufferInfo);
        twgl.setUniforms(programInfo, {
            u_input: renderTarget.texture,
        });

        twgl.drawBufferInfo(gl, this.quadBufferInfo);
    }


}
