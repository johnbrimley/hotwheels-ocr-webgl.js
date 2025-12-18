#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;   // Sobel magnitude (0..1)

uniform float u_startThreshold;
uniform float u_keepThreshold;

out vec4 outColor;

void main() {
    float strength = texture(u_input, v_uv).r;

    float strongEdge = step(u_startThreshold, strength);
    float weakEdge   = step(u_keepThreshold, strength);

    // Strong edges always kept
    // Weak edges kept only as weak (still binary here)
    float edge = max(strongEdge, weakEdge);

    outColor = vec4(edge, edge, edge, 1.0);
}
