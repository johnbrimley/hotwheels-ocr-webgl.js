#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_corners[4];
uniform float u_thickness;

out vec4 outColor;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    vec2 closest = a + t * ab;
    return length(p - closest);
}

void main() {
    vec4 base = texture(u_input, v_uv);

    vec2 p = v_uv;
    float d0 = segmentDistance(p, u_corners[0], u_corners[1]);
    float d1 = segmentDistance(p, u_corners[1], u_corners[2]);
    float d2 = segmentDistance(p, u_corners[2], u_corners[3]);
    float d3 = segmentDistance(p, u_corners[3], u_corners[0]);

    float minDist = min(min(d0, d1), min(d2, d3));

    float edge = step(u_thickness, minDist);
    float mask = 1.0 - edge;

    outColor = mix(base, vec4(1.0, 1.0, 1.0, 1.0), mask);
}
