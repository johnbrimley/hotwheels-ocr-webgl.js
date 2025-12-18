import { RenderTarget2D } from '../../RenderTarget2D';
import { PassBase } from '../PassBase';
import { PassSettingsBase } from '../PassSettingsBase';
import rec709LumaFrag from './rec-709-luma.frag?raw'

export class Rec709LumPass extends PassBase {
    lum709ProgramInfo: any;
    outputRenderTarget: any;
    constructor(gl: WebGL2RenderingContext) {
        super(gl, new PassSettingsBase());
        this.lum709ProgramInfo = this.createProgramInfo(rec709LumaFrag);
        this.outputRenderTarget = RenderTarget2D.createR8(gl);
    }

    public applyInternal(renderTargetIn: RenderTarget2D, applyToScreen: boolean): RenderTarget2D {
        if (!renderTargetIn.isRGBA8) {
            throw new Error('Rec709LumPass only supports RGBA8 render targets');
        }
        this.executeProgram(this.lum709ProgramInfo, renderTargetIn, applyToScreen ? null : this.outputRenderTarget);
        return this.outputRenderTarget;
    }
}

