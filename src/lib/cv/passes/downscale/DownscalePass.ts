import * as twgl from 'twgl.js';
import { RenderTarget2D } from "../../RenderTarget2D";
import { PassBase } from "../PassBase";
import cropFrag from "./crop.frag?raw";
import downscaleHorizontalFrag from "./downscale-horizontal.frag?raw";
import downscaleVerticalFrag from "./downscale-vertical.frag?raw";
import type { PassSettingsBase } from '../PassSettingsBase';

export class DownscalePass extends PassBase {
    private cropProgramInfo: twgl.ProgramInfo;

    private downscaleHorizontalProgramInfo: twgl.ProgramInfo;
    private downscaleVerticalProgramInfo: twgl.ProgramInfo;
    private downscaleRenderTargetPing: RenderTarget2D;
    private downscaleRenderTargetPong: RenderTarget2D;

    constructor(gl: WebGL2RenderingContext, settings: PassSettingsBase) {
        super(gl, settings);
        this.cropProgramInfo = this.createProgramInfo(cropFrag);
        this.downscaleHorizontalProgramInfo = this.createProgramInfo(downscaleHorizontalFrag);
        this.downscaleVerticalProgramInfo = this.createProgramInfo(downscaleVerticalFrag);
        this.downscaleRenderTargetPing = RenderTarget2D.createR8(gl);
        this.downscaleRenderTargetPong = RenderTarget2D.createR8(gl);
    }

    protected applyInternal(renderTargetIn: RenderTarget2D, applyToScreen: boolean): RenderTarget2D | null {
        if(!renderTargetIn.isR8){
            throw new Error("DownscalePass only supports R8 input textures.");
        }

        const smallestDimension = Math.min(renderTargetIn.framebufferInfo.width, renderTargetIn.framebufferInfo.height);
        this.downscaleRenderTargetPing.resize(smallestDimension, smallestDimension);
        this.executeProgram(this.cropProgramInfo, renderTargetIn, this.downscaleRenderTargetPing, true);

        return this.downscaleRenderTargetPing;
    }
}