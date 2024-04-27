// [COMBO] {"material":"Curve image","combo":"CURVEIMAGE","type":"options","default":1}
// [COMBO] {"material":"Frequency artifacts","combo":"ARTIFACTS","type":"options","default":1}

#include "common.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"hidden":true}
uniform sampler2D g_Texture2; // {"combo":"MASK","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform vec2 u_borders; // {"default":"0.5 0.5","group":"Screen","linked":true,"material":"Border size","range":[0,1]}
uniform float u_frequency; // {"material":"Frequency","default":10,"range":[-30,30],"group":"Screen"}
uniform float u_strength1; // {"material":"scan line strength","label":"Strength","default":0.3,"range":[0,1],"group":"Scan line"}
uniform float u_amount1; // {"material":"Scan line count","label":"Count","default":1.0,"range":[0,3],"group":"Scan line"}
uniform float u_size1; // {"material":"Size","default":1.0,"range":[0,2],"group":"Scan line"}
uniform float u_strength2; // {"material":"flicker strength","label":"Strength","default":0.5,"range":[0,1],"group":"Flicker"}
uniform float u_amount2; // {"material":"flicker amount","label":"Amount","default":0.5,"range":[0,1],"group":"Flicker"}
uniform float u_offset2; // {"material":"flicker offset","label":"Offset","default":0,"range":[0,1],"group":"Flicker"}
uniform float u_brightness; // {"material":"Brightness","default":1,"range":[0,3],"group":"Color"}
uniform float u_saturation; // {"material":"Saturation","default":0.75,"range":[0,1],"group":"Color"}
uniform float u_curvature; // {"material":"Curvature","default":0.5,"range":[0,2],"group":"Screen"}
uniform float u_resolution; // {"material":"Resolution","default":0.5,"range":[0,2],"group":"Screen"}
uniform float u_bloom; // {"material":"Light bleed","default":2.2,"range":[1,5],"group":"Imperfections"}
uniform float u_alpha; // {"material":"Opacity","default":1,"range":[0,1]}

uniform float g_Time;
uniform vec2 g_TexelSize;
varying vec2 v_TexCoord;

vec3 saturation(vec3 color) {
        vec3 weights_ = vec3(0.2126, 0.7152, 0.0722);
        float luminance_ = dot(color, weights_);
        color = mix(CAST3(luminance_), color, CAST3(u_saturation));
        return color;
}

vec3 bloom(vec3 color, vec2 uv){
    color = pow(color, CAST3(u_bloom));
    vec2 right = vec2(g_TexelSize.x, 0);
    vec2 up = vec2(0, g_TexelSize.y);

    vec3 colorT = texSample2D(g_Texture0, uv + up).rgb;
    vec3 colorB = texSample2D(g_Texture0, uv - up).rgb;
    vec3 colorL = texSample2D(g_Texture0, uv - right).rgb;
    vec3 colorR = texSample2D(g_Texture0, uv + right).rgb;
    
    right *= 2.0;
    up *= 2.0;
    
    vec3 colorTR = texSample2D(g_Texture0, uv + up + right).rgb;
    vec3 colorTL = texSample2D(g_Texture0, uv + up - right).rgb;
    vec3 colorBR = texSample2D(g_Texture0, uv - up + right).rgb;
    vec3 colorBL = texSample2D(g_Texture0, uv - up - right).rgb;
    color = color + (colorT + colorB + colorL + colorR) * 0.03 + (colorTR + colorTL + colorBR + colorBL) * 0.01;
    return pow(color, CAST3(1.0 / u_bloom));
}

void main() {
    vec4 baseAlbedo = texSample2D(g_Texture1, v_TexCoord);
#if MASK
    float mask = texSample2D(g_Texture2, v_TexCoord).r;
#else
#define mask 1.0;
#endif
    float opacity = u_alpha * mask;
    if (opacity > 0.001){
        vec2 uv = (v_TexCoord - 0.5) * u_borders;

        //Curvature
        float z = sqrt(0.5 - uv.x * uv.x * u_curvature - uv.y * uv.y * u_curvature);
        float a = 1.0 / (z * 0.69655);
        uv = uv * a;
        
        vec4 albedo = CAST4(1.0);

#if CURVEIMAGE
        vec2 coord = uv * 0.98 + 0.5;
        albedo.rgb = bloom(texSample2D(g_Texture0, coord).rgb, coord); //Light bleed
#else
        vec2 coord = (v_TexCoord - 0.5) * 2.0 * u_borders + 0.5;
        albedo.rgb = bloom(texSample2D(g_Texture0, coord).rgb, coord); //Light bleed
#endif

        albedo.rgb = saturation(albedo.rgb);
        albedo.rgb *= u_brightness * 2.0;
    
#if ARTIFACTS
        float speed = g_Time * u_frequency;
        albedo.rgb *= 1.0 - min(1.0, mod(1.0 - uv.y * u_amount1 + speed, 1.0) * u_size1) * u_strength1; //Scan line
        albedo.rgb *= 1.0 - abs(mod(1.0 - (uv.y + u_offset2) * u_amount2 + speed, 2.0) - 1.0) * u_strength2; //Flicker
#endif
    
        //Borders
        albedo *= smoothstep(-0.51, -0.50, uv.x) * smoothstep(0.51, 0.50, uv.x);
        albedo *= smoothstep(-0.51, -0.50, uv.y) * smoothstep(0.51, 0.50, uv.y);

        albedo = mix(baseAlbedo, albedo, opacity);
        gl_FragColor = albedo;
    } else gl_FragColor = baseAlbedo;
}
