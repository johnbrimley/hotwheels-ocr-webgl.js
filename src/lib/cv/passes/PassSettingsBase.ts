export class PassSettingsBase {
    private _enabled: boolean = true;
    public get enabled(): boolean {
        return this._enabled;
    }
    public set enabled(value: boolean) {
        this._enabled = value;
    }

    public get input(): WebGLTexture {
        return this.uniforms['u_input'];
    }
    public set input(value: WebGLTexture) {
        this.uniforms['u_input'] = value;
    }

    public get textelSize(): number[] {
        return this.uniforms['u_texelSize'];
    }

    public setTextelSize(width: number, height: number) {
        this.uniforms['u_texelSize'] = [1 / width, 1 / height];
    }

    public uniforms: Record<string, any> = {};
}