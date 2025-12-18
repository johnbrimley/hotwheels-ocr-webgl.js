import * as twgl from 'twgl.js';
import { RenderTarget2D } from '../../RenderTarget2D';
import { PassBase } from '../PassBase';
import type { SobelPassSettings } from './SobelPassSettings';
import sobelFrag from './sobel.frag?raw';

export class SobelPass extends PassBase {
    private sobelProgramInfo: twgl.ProgramInfo;
    private outputRenderTarget: RenderTarget2D;

    constructor(gl: WebGL2RenderingContext, settings: SobelPassSettings) {
        super(gl, settings);
        this.sobelProgramInfo = this.createProgramInfo(sobelFrag);
        this.outputRenderTarget = RenderTarget2D.createRGBA8(gl);
    }

    public applyInternal(renderTargetIn: RenderTarget2D, applyToScreen: boolean): RenderTarget2D {
        if (!renderTargetIn.isR8 && !renderTargetIn.isRGBA8) {
            throw new Error('SobelPass expects R8 or RGBA8 render targets');
        }
        this.executeProgram(this.sobelProgramInfo, renderTargetIn, applyToScreen ? null : this.outputRenderTarget);
        return this.outputRenderTarget;
    }
}
