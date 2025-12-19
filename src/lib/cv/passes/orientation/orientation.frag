#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;
uniform int u_flipX;
uniform int u_flipY;

out vec4 outColor;

void main() {
    vec2 uv = v_uv;
    if (u_flipX == 1) uv.x = 1.0 - uv.x;
    if (u_flipY == 1) uv.y = 1.0 - uv.y;
    outColor = texture(u_input, uv);
}
