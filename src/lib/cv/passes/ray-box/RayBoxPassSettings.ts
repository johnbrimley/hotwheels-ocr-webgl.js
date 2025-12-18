import { PassSettingsBase } from "../PassSettingsBase";

export class RayBoxPassSettings extends PassSettingsBase {
    public get threshold(): number {
        return this.uniforms['u_threshold'];
    }
    public set threshold(value: number) {
        this.uniforms['u_threshold'] = value;
    }

    public get rayCount(): number {
        return this.uniforms['u_rayCount'];
    }
    public set rayCount(value: number) {
        this.uniforms['u_rayCount'] = value;
    }

    public get angleThreshold(): number {
        return this.uniforms['u_angleThreshold'];
    }
    public set angleThreshold(value: number) {
        this.uniforms['u_angleThreshold'] = value;
    }

    public get distanceThreshold(): number {
        return this.uniforms['u_distanceThreshold'];
    }
    public set distanceThreshold(value: number) {
        this.uniforms['u_distanceThreshold'] = value;
    }
}
