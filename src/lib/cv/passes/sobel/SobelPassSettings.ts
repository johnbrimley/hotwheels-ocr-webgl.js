import { PassSettingsBase } from "../PassSettingsBase";

export class SobelPassSettings extends PassSettingsBase {
    public get kernelRadius(): number {
        return this.uniforms['u_kernelRadius'];
    }
    public set kernelRadius(value: number) {
        this.uniforms['u_kernelRadius'] = value;
    }

    public get directionBias(): number {
        return this.uniforms['u_directionBias'];
    }
    public set directionBias(value: number) {
        this.uniforms['u_directionBias'] = value;
    }

    public get edgeGain(): number {
        return this.uniforms['u_edgeGain'];
    }
    public set edgeGain(value: number) {
        this.uniforms['u_edgeGain'] = value;
    }

    public get minEdge(): number {
        return this.uniforms['u_minEdge'];
    }
    public set minEdge(value: number) {
        this.uniforms['u_minEdge'] = value;
    }
}
