#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_texelSize;   // 1 / input resolution

out vec4 outColor;

// 1D kernel: [1 4 6 4 1] / 16
void main()
{
    vec2 dx = vec2(u_texelSize.x, 0.0);

    vec4 c0 = texture(u_input, v_uv - 2.0 * dx);
    vec4 c1 = texture(u_input, v_uv - 1.0 * dx);
    vec4 c2 = texture(u_input, v_uv);
    vec4 c3 = texture(u_input, v_uv + 1.0 * dx);
    vec4 c4 = texture(u_input, v_uv + 2.0 * dx);

    outColor = (c0 + c4) * (1.0 / 16.0)
             + (c1 + c3) * (4.0 / 16.0)
             +  c2        * (6.0 / 16.0);
}
