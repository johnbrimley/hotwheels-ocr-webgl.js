import { PassSettingsBase } from "../PassSettingsBase";

export class OrientationPassSettings extends PassSettingsBase {
    public get flipX(): boolean {
        return !!this.uniforms['u_flipX'];
    }
    public set flipX(value: boolean) {
        this.uniforms['u_flipX'] = value ? 1 : 0;
    }

    public get flipY(): boolean {
        return !!this.uniforms['u_flipY'];
    }
    public set flipY(value: boolean) {
        this.uniforms['u_flipY'] = value ? 1 : 0;
    }
}
