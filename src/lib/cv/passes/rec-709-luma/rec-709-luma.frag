#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_input;

out vec4 outColor;

void main() {
    vec3 color = texture(u_input, v_uv).rgb;

    // Rec.709 luma
    float luma = dot(color, vec3(
        0.2126,  // R
        0.7152,  // G
        0.0722   // B
    ));

    outColor = vec4(luma, luma, luma, 1.0);
}
