#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2      u_texelSize;

uniform int   u_kernelRadius;     // 1 = 3x3, 2 = 5x5
uniform float u_directionBias;    // -1 vertical, +1 horizontal
uniform float u_edgeGain;
uniform float u_minEdge;

out vec4 outColor;

/* 3x3 Sobel expanded into 5x5 space */
const float d3[5] = float[5](0.0, -1.0, 0.0, 1.0, 0.0);
const float s3[5] = float[5](0.0,  1.0, 2.0, 1.0, 0.0);

/* True 5x5 Sobel */
const float d5[5] = float[5](-2.0, -1.0, 0.0, 1.0, 2.0);
const float s5[5] = float[5]( 1.0,  4.0, 6.0, 4.0, 1.0);

void main() {
    vec2 uv = v_uv;
    vec2 t  = u_texelSize;

    float gradX = 0.0;
    float gradY = 0.0;

    float use5 = step(1.5, float(u_kernelRadius));
    float use3 = 1.0 - use5;

    float kernelNormalization =
    mix(1.0, 1.0 / 12.0, use5);

    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {

            vec2 offset = vec2(float(x - 2), float(y - 2)) * t;
            float luma  = texture(u_input, uv + offset).r;

            float gx =
                d3[x] * s3[y] * use3 +
                d5[x] * s5[y] * use5;

            float gy =
                s3[x] * d3[y] * use3 +
                s5[x] * d5[y] * use5;

            gradX += luma * gx;
            gradY += luma * gy;
        }
    }

    float ax = abs(gradX);
    float ay = abs(gradY);

    float wX = clamp(1.0 - u_directionBias, 0.0, 2.0) * 0.5;
    float wY = clamp(1.0 + u_directionBias, 0.0, 2.0) * 0.5;

    float edge =
        wX * ax +
        wY * ay;

    edge = edge * kernelNormalization;
    edge = max(edge * u_edgeGain - u_minEdge, 0.0);

    outColor = vec4(edge, edge, edge, 1.0);
}
