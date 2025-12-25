#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_texelSize;   // 1 / input resolution

out vec4 outColor;

void main()
{
    // Derive input size in pixels
    vec2 inputSize = 1.0 / u_texelSize;

    // Output size (square) inferred from framebuffer
    // v_uv ∈ [0,1], so multiply by output dimension in pixels
    float outSize = min(inputSize.x, inputSize.y);

    // Output pixel coordinate
    vec2 outPx = v_uv * outSize;

    // Center crop origin in input pixel space
    vec2 cropOrigin = 0.5 * (inputSize - vec2(outSize));

    // Input pixel coordinate
    vec2 inPx = cropOrigin + outPx;

    // Convert to UV (pixel-center correct)
    vec2 inUV = (inPx + 0.5) * u_texelSize;

    outColor = texture(u_input, inUV);
}
