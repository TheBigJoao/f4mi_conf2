#include "common.h"

uniform mat4 g_ModelViewProjectionMatrix;
uniform float g_Time;

// [COMBO] {"material":"Follow Cursor","combo":"FOLLOWCURSOR","type":"options","default":1}

uniform vec2 g_Scale; // {"default":"1 1","label":"Scale","linked":true,"material":"scale","range":[0.01,10.0]}

#if !FOLLOWCURSOR
uniform vec2 g_Scale_Multiplier; // {"default":"1 1","label":"Scale Multiplier","linked":true,"material":"scale_multiplier","range":[0.01,10.0]}
uniform float g_Speed; // {"material":"speed","label":"ui_editor_properties_speed","default":1,"range":[0.01, 2.0]}
uniform float g_Rough; // {"material":"rough","label":"ui_editor_properties_smoothness","default":0.2,"range":[0.01, 1.0]}
uniform float g_NoiseAmount; // {"material":"noiseamount","label":"ui_editor_properties_noise_amount","default":0.5,"range":[0.01, 2.0]}
uniform float g_PhaseOffset; // {"material":"phase", "label":"ui_editor_properties_phase", "default":0,"range":[-1, 1]}
#endif

#if FOLLOWCURSOR
uniform vec2 g_Scale_FollowCursor_Multiplier; // {"default":"1 1","label":"Scale Follow Cursor Multiplier","linked":true,"material":"scale_followcursor_multiplier","range":[0.01,10.0]}

uniform mat4 g_EffectTextureProjectionMatrixInverse;
uniform vec2 g_PointerPosition;
uniform vec2 g_PointerPositionLast;

varying vec4 v_PointerUV;
#endif

#if MASK
uniform vec4 g_Texture1Resolution;
#endif

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec4 v_TexCoord;
varying vec2 v_TexCoordIris;

void main() {
    gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
    v_TexCoord = a_TexCoord.xyxy;

    
    
#if MASK
    v_TexCoord.zw = vec2(v_TexCoord.x * g_Texture1Resolution.z / g_Texture1Resolution.x,
                        v_TexCoord.y * g_Texture1Resolution.w / g_Texture1Resolution.y);
#endif

    #if !FOLLOWCURSOR
        float time = (g_Time * g_Speed) + g_PhaseOffset;

	    float lowDt = floor(time);
	    vec2 motion2 = sin(1.9 * (lowDt + vec2(0, 1)));
	    vec4 motion4 = sin(2.5 * (lowDt + vec4(0, 0, 1, 1)) + vec4(1, 2, 1, 2));
	    vec2 moveStart = motion2.xx + motion4.xy;
	    vec2 moveEnd = motion2.yy + motion4.zw;
	    vec2 da = mix(moveStart, moveEnd, smoothstep(1 - g_Rough, 1, cos(frac(time) * M_PI) * -0.5 + 0.5));

	    da.x += sin(time) * g_NoiseAmount;
	    da.y += cos(time) * g_NoiseAmount;
	
	    da *= g_Scale * 0.001 * g_Scale_Multiplier;
	    v_TexCoordIris = da.xy;
    #endif

    #if FOLLOWCURSOR
        vec2 pointer = g_PointerPosition;
	    pointer.y = 1.0 - pointer.y; // Flip pointer screen space Y to match texture space Y
        pointer.x = 1.0 - pointer.x; // Flip pointer screen space X to match texture space X

        vec4 preTransformPoint = vec4(pointer * 2 - 1, 0.0, 1.0);

	    v_PointerUV.xyz = mul(preTransformPoint, g_EffectTextureProjectionMatrixInverse).xyw;
	    v_PointerUV.xy *= 0.5;
	    v_PointerUV.xy /= v_PointerUV.z;

        vec2 da = v_PointerUV * (g_Scale * g_Scale_FollowCursor_Multiplier) * 0.001; // Apply scaling factor to direction
        v_TexCoordIris = da.xy;
    #endif
}