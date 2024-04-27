// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}

// [COMBO] {"material":"Chromatic Aberration","combo":"CA","type":"options","default":1}
// [COMBO] {"material":"Noise","combo":"NOI","type":"options","default":1}
// [COMBO] {"material":"Interlace","combo":"IL","type":"options","default":1}

#include "common.h"
#include "common_blending.h"

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"default":"util/noise","hidden":false,"material":"noise"}
//uniform float u_Scale; // {"material":"Scale","default":0,"range":[-100,100]}
uniform float u_ScreenBounceX; // {"material":"Bounce X","default":1,"range":[-10,10]}
uniform float u_ScreenBounceY; // {"material":"Bounce Y","default":0,"range":[-10,10]}
uniform float u_Warp; // {"material":"Warp","default":0.01,"range":[0,0.1]}
uniform float u_InterlaceX; // {"material":"CA interlace X","default":1,"range":[-10,10]}
uniform float u_InterlaceY; // {"material":"CA interlace Y","default":0,"range":[-10,10]}
uniform float u_FaultMulti1; // {"material":"Fault 1 multiplier","default":1,"range":[0,100]}
uniform float u_FaultScale1; // {"material":"Fault 1 scale","default":100,"range":[0,500]}
uniform float u_FaultMulti2; // {"material":"Fault 2 multiplier","default":16,"range":[0,100]}
uniform float u_FaultScale2; // {"material":"Fault 2 scale","default":200,"range":[0,500]}

uniform float u_DistOpacity; // {"default":"1","material":"Opacity"}
uniform float u_TimeSpeed; // {"material":"Speed","default":1,"range":[-10,10]}
uniform float u_NoiseSpeed; // {"material":"Noise speed","default":10,"range":[-10,10]}
uniform float u_NoiseOpacity; // {"default":"0.25","material":"Noise opacity"}
uniform float g_Time;

uniform vec4 g_Texture0Resolution;

varying vec4 v_TexCoord;

#define pi 3.1415926

float t;

vec3 colorSplit(vec2 uv, vec2 s)
{
    vec3 color;
#if CA==1
    color.r = texSample2D(g_Texture0, uv - s).r;
    color.g = texSample2D(g_Texture0, uv    ).g;
    color.b = texSample2D(g_Texture0, uv + s).b;
#endif

#if CA==0
    color.r = texSample2D(g_Texture0, uv).r;
    color.g = texSample2D(g_Texture0, uv).g;
    color.b = texSample2D(g_Texture0, uv).b;
#endif

    return color;
}






vec2 interlace(vec2 uv, float s)
{
    uv.x += s * (u_InterlaceX * frac((uv.y * g_Texture0Resolution.y) / 2.0) - 1.0);
    uv.y += s * (u_InterlaceY * frac((uv.x * g_Texture0Resolution.x) / 2.0) - 1.0);
    return uv;
}


vec2 fault(vec2 uv, float s)
{
    //float v = (0.5 + 0.5 * cos(2.0 * pi * uv.y)) * (2.0 * uv.y - 1.0);
    float v = pow(0.5 - 0.5 * cos(2.0 * pi * uv.y  * u_FaultMulti1), u_FaultScale1) * sin(2.0 * pi * uv.y);
    uv.x += v * s;
    return uv;
}



vec2 fault2(vec2 uv, float s)
{
    //float v = (0.5 + 0.5 * cos(1.0 * pi * uv.y)) * (2.0 * uv.y - 1.0);
    float v = pow(0.5 - 0.5 * cos(1.0 * pi * uv.y * u_FaultMulti2), u_FaultScale2) * sin(1.5 * pi * uv.y);
    uv.x += v * s;
    return uv;
}

vec2 rnd(vec2 uv, float s)
{
    uv.x += s * (2.0 * texSample2D(g_Texture1, uv * 0.05).x - u_ScreenBounceX);
    uv.y += s * (2.0 * texSample2D(g_Texture1, uv * 0.05).y - u_ScreenBounceY);
    return uv;
}

void main()
{
    vec4 scene = texSample2D(g_Texture0, v_TexCoord.xy);
    float t = frac(g_Time / 10.0) * u_TimeSpeed;

	vec2 uv = v_TexCoord.xy + 0.5 / g_Texture0Resolution.xy; // * u_Scale * 100;
    
    //float s = pow(0.5 + 0.5 * cos(2.0 * pi * t), 1000.0);
    float s = texSample2D(g_Texture1, vec2(t * 0.2, 0.5)).r;

#if IL ==1
    uv = interlace(uv, s * 0.005);
#endif

#if IL ==0
    //uv = fault(uv, s);
#endif

    float r = texSample2D(g_Texture1, vec2(t, 0.0)).x;
    //uv = fault(uv + vec2(0.0, fract(t * 20.0)), r) - vec2(0.0, fract(t * 20.0));
    uv = fault(uv + vec2(0.0, frac(t * 2.0)), 5.0 * sign(r) * pow(abs(r), 5.0)) - vec2(0.0, frac(t * 2.0));
    uv = fault2(uv + vec2(0.0, frac(t * 2.0)), 5.0 * sign(r) * pow(abs(r), 5.0)) - vec2(0.0, frac(t * 2.0));
    uv = rnd(uv, s *u_Warp);

    vec3 color = colorSplit(uv, vec2(s * 0.02, 0.0));

#if NOI ==1
    color = mix(color, texSample2D(g_Texture1, 0.5 * uv + t * u_NoiseSpeed).rgb, u_NoiseOpacity);
#endif   

#if NOI == 0
    color = mix(color, texSample2D(g_Texture0, 0 * uv + t ).rgb,0);
#endif
    



    vec3 finalColor = color;

	// Apply blend mode
	finalColor = ApplyBlending(BLENDMODE, lerp(finalColor.rgb, scene.rgb, scene.a), finalColor.rgb, u_DistOpacity);

float alpha = scene.a;

	gl_FragColor = vec4(finalColor, alpha);
}



// // Monitor Glitch - Shader-Effect simulating bad TV reception
// // https://www.shadertoy.com/view/ltSSWV
// // Written in 2015 by JT (shaderview@protonmail.com)
// //
// // CC0 License
// //
// // To the extent possible under law, the author has dedicated
// // all copyright and related and neighboring rights to this software
// // to the public domain worldwide.
// // This software is distributed without any warranty.
// //
// // For a copy of the CC0 Public Domain Dedication see <http://creativecommons.org/publicdomain/zero/1.0/>.