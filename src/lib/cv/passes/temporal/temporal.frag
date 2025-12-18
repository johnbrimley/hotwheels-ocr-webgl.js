#version 300 es
precision highp float;

in vec2 v_uv;

/*
  u_input is always bound by the pipeline
  and represents the CURRENT frame.
*/
uniform sampler2D u_input;

uniform sampler2D u_frame1;
uniform sampler2D u_frame2;
uniform sampler2D u_frame3;
uniform sampler2D u_frame4;

out vec4 outColor;

/*
  Exact median of 5 values.
  Deterministic, branchless.
*/
float median5(
    float v0,
    float v1,
    float v2,
    float v3,
    float v4
) {
    float a = min(v0, v1);
    float b = max(v0, v1);
    float c = min(v2, v3);
    float d = max(v2, v3);

    float e = max(a, c);
    float f = min(b, d);

    float g = min(e, f);
    float h = max(e, f);

    return max(min(h, v4), g);
}

void main() {
    float value0 = texture(u_input,  v_uv).r;
    float value1 = texture(u_frame1, v_uv).r;
    float value2 = texture(u_frame2, v_uv).r;
    float value3 = texture(u_frame3, v_uv).r;
    float value4 = texture(u_frame4, v_uv).r;

    float medianValue =
        median5(value0, value1, value2, value3, value4);

    outColor = vec4(medianValue, medianValue, medianValue, 1.0);
}
