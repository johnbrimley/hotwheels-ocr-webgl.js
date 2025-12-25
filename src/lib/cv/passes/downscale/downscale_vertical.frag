#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_texelSize;   // 1 / input resolution (the horizontally blurred texture)

out vec4 outColor;

void main()
{
    // derive input size in pixels
    vec2 inSize = 1.0 / u_texelSize;

    // output size is half input size (assumed)
    vec2 outSize = inSize * 0.5;

    // output pixel coordinate (in pixels)
    vec2 outPx = v_uv * outSize;

    // map to input pixel center at (2x+0.5, 2y+0.5)
    vec2 inPxCenter = outPx * 2.0 + vec2(0.5);

    // convert to UV
    vec2 baseUV = inPxCenter * u_texelSize;

    // vertical taps around that center in input texels
    vec2 dy = vec2(0.0, u_texelSize.y);

    vec4 c0 = texture(u_input, baseUV - 2.0 * dy);
    vec4 c1 = texture(u_input, baseUV - 1.0 * dy);
    vec4 c2 = texture(u_input, baseUV);
    vec4 c3 = texture(u_input, baseUV + 1.0 * dy);
    vec4 c4 = texture(u_input, baseUV + 2.0 * dy);

    outColor = (c0 + c4) * (1.0 / 16.0)
             + (c1 + c3) * (4.0 / 16.0)
             +  c2        * (6.0 / 16.0);
}
