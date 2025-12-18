export class PassSettingsBase{
    get input(): WebGLTexture{
        return this.uniforms['u_input'];
    }
    set input(value: WebGLTexture){
        this.uniforms['u_input'] = value;
    }

    get textelSize(): number[]{
        return this.uniforms['u_texelSize'];
    }

    setTextelSize(width: number, height: number){
        this.uniforms['u_texelSize'] = [1/width, 1/height];
    }

    public uniforms: Record<string, any> = {};
}