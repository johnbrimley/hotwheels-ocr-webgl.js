import * as twgl from 'twgl.js';
import { RenderTarget2D } from '../../RenderTarget2D';
import { PassBase } from '../PassBase';
import type { RayBoxPassSettings } from './RayBoxPassSettings';
import boxOverlayFrag from './box-overlay.frag?raw';

type LineNormal = { theta: number; rho: number; score: number };
type Point = { x: number; y: number };

export class RayBoxPass extends PassBase {
    private boxProgramInfo: twgl.ProgramInfo;
    private outputRenderTarget: RenderTarget2D;
    private pixelBuffer: Uint8Array | null = null;
    private pixelFormat: number = 0;
    private pixelChannels: number = 0;

    constructor(gl: WebGL2RenderingContext, settings: RayBoxPassSettings) {
        super(gl, settings);
        this.boxProgramInfo = this.createProgramInfo(boxOverlayFrag);
        this.outputRenderTarget = RenderTarget2D.createRGBA8(gl);
    }

    private ensurePixelBuffer(width: number, height: number, channels: number): void {
        const needed = width * height * channels;
        if (!this.pixelBuffer || this.pixelBuffer.length !== needed) {
            this.pixelBuffer = new Uint8Array(needed);
        }
        this.pixelChannels = channels;
    }

    private readPixelsToBuffer(renderTargetIn: RenderTarget2D): { width: number; height: number } {
        const width = renderTargetIn.framebufferInfo.width;
        const height = renderTargetIn.framebufferInfo.height;
        const isR8 = renderTargetIn.isR8;

        const format = isR8 ? this.gl.RED : this.gl.RGBA;
        const channels = isR8 ? 1 : 4;
        this.pixelFormat = format;
        this.ensurePixelBuffer(width, height, channels);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, renderTargetIn.framebufferInfo.framebuffer);
        this.gl.readPixels(
            0,
            0,
            width,
            height,
            format,
            this.gl.UNSIGNED_BYTE,
            this.pixelBuffer!
        );
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return { width, height };
    }

    private sample(x: number, y: number, width: number): number {
        if (!this.pixelBuffer) return 0;
        const xi = Math.max(0, Math.min(width - 1, Math.round(x)));
        const yi = Math.max(0, Math.round(y));
        const idx = (yi * width + xi) * this.pixelChannels;
        const v = this.pixelBuffer[idx];
        return v / 255;
    }

    private findRayHits(width: number, height: number, threshold: number, rayCount: number): Point[] {
        const cx = (width - 1) / 2;
        const cy = (height - 1) / 2;
        const hits: Point[] = [];

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            // distance to boundary along direction
            const tx = dx > 0 ? (width - 1 - cx) / dx : dx < 0 ? (0 - cx) / dx : Number.POSITIVE_INFINITY;
            const ty = dy > 0 ? (height - 1 - cy) / dy : dy < 0 ? (0 - cy) / dy : Number.POSITIVE_INFINITY;
            const tStart = Math.min(tx, ty);

            for (let t = tStart; t >= 0; t -= 1) {
                const x = cx + dx * t;
                const y = cy + dy * t;
                const value = this.sample(x, y, width);
                if (value >= threshold) {
                    hits.push({ x: x / (width - 1), y: y / (height - 1) });
                    break;
                }
            }
        }

        return hits;
    }

    private lineFromPoints(a: Point, b: Point): { theta: number; rho: number } {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let theta = Math.atan2(dy, dx) + Math.PI / 2;
        if (theta < 0) theta += Math.PI * 2;
        if (theta >= Math.PI * 2) theta -= Math.PI * 2;
        const rho = a.x * Math.cos(theta) + a.y * Math.sin(theta);
        return { theta, rho };
    }

    private scoreLine(line: { theta: number; rho: number }, targetTheta: number, angleThresh: number, distThresh: number): number {
        const angDiff = Math.abs(((line.theta - targetTheta + Math.PI) % (Math.PI * 2)) - Math.PI);
        const angleScore = Math.max(0, 1 - angDiff / angleThresh);
        const distScore = Math.max(0, 1 - Math.abs(line.rho) / distThresh);
        return angleScore * distScore;
    }

    private intersection(l1: { theta: number; rho: number }, l2: { theta: number; rho: number }): Point | null {
        const c1 = Math.cos(l1.theta);
        const s1 = Math.sin(l1.theta);
        const c2 = Math.cos(l2.theta);
        const s2 = Math.sin(l2.theta);

        const det = c1 * s2 - s1 * c2;
        if (Math.abs(det) < 1e-6) return null;

        const x = (l1.rho * s2 - l2.rho * s1) / det;
        const y = (l2.rho * c1 - l1.rho * c2) / det;
        return { x, y };
    }

    private computeBoxCorners(lines: (LineNormal | null)[]): Point[] {
        const corners: Point[] = [];
        const fallback: Point = { x: 0.5, y: 0.5 };
        for (let i = 0; i < 4; i++) {
            const l1 = lines[i];
            const l2 = lines[(i + 1) % 4];
            if (l1 && l2) {
                const p = this.intersection(l1, l2);
                corners.push(p ?? fallback);
            } else {
                corners.push(fallback);
            }
        }
        return corners;
    }

    private selectLines(lines: { theta: number; rho: number }[], settings: RayBoxPassSettings): (LineNormal | null)[] {
        const targets = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const results: (LineNormal | null)[] = [null, null, null, null];

        for (const line of lines) {
            for (let i = 0; i < targets.length; i++) {
                const score = this.scoreLine(line, targets[i], settings.angleThreshold, settings.distanceThreshold);
                if (score > 0 && (!results[i] || score > results[i]!.score)) {
                    results[i] = { ...line, score };
                }
            }
        }

        return results;
    }

    private overlayBox(renderTargetIn: RenderTarget2D, corners: Point[]): void {
        // ensure output matches input size
        if (this.outputRenderTarget.framebufferInfo.width !== renderTargetIn.framebufferInfo.width ||
            this.outputRenderTarget.framebufferInfo.height !== renderTargetIn.framebufferInfo.height) {
            this.outputRenderTarget.resize(renderTargetIn.framebufferInfo.width, renderTargetIn.framebufferInfo.height);
        }

        this.executeProgram(this.boxProgramInfo, renderTargetIn, this.outputRenderTarget);
    }

    public applyInternal(renderTargetIn: RenderTarget2D, applyToScreen: boolean): RenderTarget2D {
        const settings = this.settings as RayBoxPassSettings;
        const { width, height } = this.readPixelsToBuffer(renderTargetIn);

        const hits = this.findRayHits(width, height, settings.threshold, Math.max(4, Math.floor(settings.rayCount)));

        const lines: { theta: number; rho: number }[] = [];
        for (let i = 0; i < hits.length; i++) {
            const a = hits[i];
            const b = hits[(i + 1) % hits.length];
            lines.push(this.lineFromPoints(a, b));
        }

        const selected = this.selectLines(lines, settings);
        const corners = this.computeBoxCorners(selected);

        // render overlay
        this.executeProgram(this.boxProgramInfo, renderTargetIn, applyToScreen ? null : this.outputRenderTarget);
        const uniformCorners = [
            corners[0].x, corners[0].y,
            corners[1].x, corners[1].y,
            corners[2].x, corners[2].y,
            corners[3].x, corners[3].y,
        ];
        const uniforms = {
            u_corners: uniformCorners,
            u_thickness: 1.5 / Math.max(width, height),
            u_input: renderTargetIn.texture,
        };
        twgl.setUniforms(this.boxProgramInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo);

        return this.outputRenderTarget;
    }
}
