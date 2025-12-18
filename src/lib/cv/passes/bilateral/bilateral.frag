#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_input;        // R8 luma input
uniform vec2      u_texelSize;    // 1 / texture resolution

uniform float u_sigmaSpatial;     // spatial Gaussian sigma
uniform float u_sigmaRange;       // range (luma) Gaussian sigma
uniform int   u_kernelRadius;     // must be <= MAX_KERNEL_RADIUS

out vec4 outColor;

const int MAX_KERNEL_RADIUS = 5;

void main() {

    vec2 uv = v_uv;

    // Center pixel (luma)
    float centerLuma = texture(u_input, uv).r;

    float weightedSum = 0.0;
    float weightTotal = 0.0;

    // Precompute inverse variances
    float invSpatialVar = 1.0 / (2.0 * u_sigmaSpatial * u_sigmaSpatial);
    float invRangeVar   = 1.0 / (2.0 * u_sigmaRange   * u_sigmaRange);

    for (int ky = -MAX_KERNEL_RADIUS; ky <= MAX_KERNEL_RADIUS; ++ky) {
        for (int kx = -MAX_KERNEL_RADIUS; kx <= MAX_KERNEL_RADIUS; ++kx) {

            // Branchless kernel mask
            float maskX = step(float(abs(kx)), float(u_kernelRadius));
            float maskY = step(float(abs(ky)), float(u_kernelRadius));
            float kernelMask = maskX * maskY;

            vec2 offsetTexel =
                vec2(float(kx), float(ky)) * u_texelSize;

            float neighborLuma =
                texture(u_input, uv + offsetTexel).r;

            float spatialDist2 =
                float(kx * kx + ky * ky);

            float rangeDist2 =
                (neighborLuma - centerLuma) *
                (neighborLuma - centerLuma);

            float weightSpatial =
                exp(-spatialDist2 * invSpatialVar);

            float weightRange =
                exp(-rangeDist2 * invRangeVar);

            float kernelWeight =
                weightSpatial * weightRange * kernelMask;

            weightedSum += neighborLuma * kernelWeight;
            weightTotal += kernelWeight;
        }
    }

    float filteredLuma = weightedSum / weightTotal;

    outColor = vec4(filteredLuma,
                    filteredLuma,
                    filteredLuma,
                    1.0);
}
