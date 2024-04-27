// [COMBO] {"material":"Quality","combo":"QUALITY","type":"options","default":2,"options":{"Ultra":0,"High":1,"Medium":2,"Low":3}}
// [COMBO] {"material":"Visualize circle of confusion","combo":"COC","type":"options","default":0,"require":{"MODE":1}}
// [COMBO] {"material":"Mode","combo":"MODE","type":"options","default":0,"options":{"Mask":0,"Depth of field":1}}

#include "common.h"
#include "common_blending.h"

uniform sampler2D g_Texture0; // {"hidden":true}
uniform sampler2D g_Texture1; // {"hidden":true}
uniform sampler2D g_Texture2; // {"hidden":true}
uniform float u_gamma; // {"material":"Gamma","default":1,"range":[1,5],"group":"Lens"}
uniform float u_lightFactor; // {"material":"Highlights","default":1,"range":[0,1],"group":"Lens"}
uniform float u_ratio; // {"material":"Ratio","default":2.39,"range":[1,4],"group":"Lens"}

varying vec2 v_TexCoord;
varying vec2 v_PixelSize;
varying float v_Aperture;
varying vec2 v_Gamma;
varying vec2 v_Highlights;

#define KERNEL16 vec2(0,0),vec2(0.54545456,0),vec2(0.16855472,0.5187581),vec2(-0.44128203,0.3206101),vec2(-0.44128197,-0.3206102),vec2(0.1685548,-0.5187581),vec2(1,0),vec2(0.809017,0.58778524),vec2(0.30901697,0.95105654),vec2(-0.30901703,0.9510565),vec2(-0.80901706,0.5877852),vec2(-1,0),vec2(-0.80901694,-0.58778536),vec2(-0.30901664,-0.9510566),vec2(0.30901712,-0.9510565),vec2(0.80901694,-0.5877853)

#define KERNEL22 vec2(0,0),vec2(0.53333336,0),vec2(0.3325279,0.4169768),vec2(-0.11867785,0.5199616),vec2(-0.48051673,0.2314047),vec2(-0.48051673,-0.23140468),vec2(-0.11867763,-0.51996166),vec2(0.33252785,-0.4169769),vec2(1,0),vec2(0.90096885,0.43388376),vec2(0.6234898,0.7818315),vec2(0.22252098,0.9749279),vec2(-0.22252095,0.9749279),vec2(-0.62349,0.7818314),vec2(-0.90096885,0.43388382),vec2(-1,0),vec2(-0.90096885,-0.43388376),vec2(-0.6234896,-0.7818316),vec2(-0.22252055,-0.974928),vec2(0.2225215,-0.9749278),vec2(0.6234897,-0.7818316),vec2(0.90096885,-0.43388376)

#define KERNEL43 vec2(0,0),vec2(0.36363637,0),vec2(0.22672357,0.28430238),vec2(-0.08091671,0.35451925),vec2(-0.32762504,0.15777594),vec2(-0.32762504,-0.15777591),vec2(-0.08091656,-0.35451928),vec2(0.22672352,-0.2843024),vec2(0.6818182,0),vec2(0.614297,0.29582983),vec2(0.42510667,0.5330669),vec2(0.15171885,0.6647236),vec2(-0.15171883,0.6647236),vec2(-0.4251068,0.53306687),vec2(-0.614297,0.29582986),vec2(-0.6818182,0),vec2(-0.614297,-0.29582983),vec2(-0.42510656,-0.53306705),vec2(-0.15171856,-0.66472363),vec2(0.1517192,-0.6647235),vec2(0.4251066,-0.53306705),vec2(0.614297,-0.29582983),vec2(1,0),vec2(0.9555728,0.2947552),vec2(0.82623875,0.5633201),vec2(0.6234898,0.7818315),vec2(0.36534098,0.93087375),vec2(0.07473,0.9972038),vec2(-0.22252095,0.9749279),vec2(-0.50000006,0.8660254),vec2(-0.73305196,0.6801727),vec2(-0.90096885,0.43388382),vec2(-0.98883086,0.14904208),vec2(-0.9888308,-0.14904249),vec2(-0.90096885,-0.43388376),vec2(-0.73305184,-0.6801728),vec2(-0.4999999,-0.86602545),vec2(-0.222521,-0.9749279),vec2(0.07473029,-0.99720377),vec2(0.36534148,-0.9308736),vec2(0.6234897,-0.7818316),vec2(0.8262388,-0.56332),vec2(0.9555729,-0.29475483)

#define KERNEL71 vec2(0,0),vec2(0.2758621,0),vec2(0.1719972,0.21567768),vec2(-0.061385095,0.26894566),vec2(-0.24854316,0.1196921),vec2(-0.24854316,-0.11969208),vec2(-0.061384983,-0.2689457),vec2(0.17199717,-0.21567771),vec2(0.51724136,0),vec2(0.46601835,0.22442262),vec2(0.32249472,0.40439558),vec2(0.11509705,0.50427306),vec2(-0.11509704,0.50427306),vec2(-0.3224948,0.40439552),vec2(-0.46601835,0.22442265),vec2(-0.51724136,0),vec2(-0.46601835,-0.22442262),vec2(-0.32249463,-0.40439564),vec2(-0.11509683,-0.5042731),vec2(0.11509732,-0.504273),vec2(0.32249466,-0.40439564),vec2(0.46601835,-0.22442262),vec2(0.7586207,0),vec2(0.7249173,0.22360738),vec2(0.6268018,0.4273463),vec2(0.47299224,0.59311354),vec2(0.27715522,0.7061801),vec2(0.056691725,0.75649947),vec2(-0.168809,0.7396005),vec2(-0.3793104,0.65698475),vec2(-0.55610836,0.51599306),vec2(-0.6834936,0.32915324),vec2(-0.7501475,0.113066405),vec2(-0.7501475,-0.11306671),vec2(-0.6834936,-0.32915318),vec2(-0.5561083,-0.5159932),vec2(-0.37931028,-0.6569848),vec2(-0.16880904,-0.7396005),vec2(0.056691945,-0.7564994),vec2(0.2771556,-0.7061799),vec2(0.47299215,-0.59311366),vec2(0.62680185,-0.4273462),vec2(0.72491735,-0.22360711),vec2(1,0),vec2(0.9749279,0.22252093),vec2(0.90096885,0.43388376),vec2(0.7818315,0.6234898),vec2(0.6234898,0.7818315),vec2(0.43388364,0.9009689),vec2(0.22252098,0.9749279),vec2(0,1),vec2(-0.22252095,0.9749279),vec2(-0.43388385,0.90096885),vec2(-0.62349,0.7818314),vec2(-0.7818317,0.62348956),vec2(-0.90096885,0.43388382),vec2(-0.9749279,0.22252093),vec2(-1,0),vec2(-0.9749279,-0.22252087),vec2(-0.90096885,-0.43388376),vec2(-0.7818314,-0.6234899),vec2(-0.6234896,-0.7818316),vec2(-0.43388346,-0.900969),vec2(-0.22252055,-0.974928),vec2(0,-1),vec2(0.2225215,-0.9749278),vec2(0.4338835,-0.90096897),vec2(0.6234897,-0.7818316),vec2(0.78183144,-0.62348986),vec2(0.90096885,-0.43388376),vec2(0.9749279,-0.22252086)

#if QUALITY == 3
#define kernelSampleCount 16
#if HLSL
const vec2 kernel[kernelSampleCount] = {KERNEL16};
#else
const vec2 kernel[kernelSampleCount] = vec2[kernelSampleCount](KERNEL16);
#endif
#endif
#if QUALITY == 2
#define kernelSampleCount 22
#if HLSL
const vec2 kernel[kernelSampleCount] = {KERNEL22};
#else
const vec2 kernel[kernelSampleCount] = vec2[kernelSampleCount](KERNEL22);
#endif
#endif
#if QUALITY == 1
#define kernelSampleCount 43
#if HLSL
const vec2 kernel[kernelSampleCount] = {KERNEL43};
#else
const vec2 kernel[kernelSampleCount] = vec2[kernelSampleCount](KERNEL43);
#endif
#endif
#if QUALITY == 0
#define kernelSampleCount 71
#if HLSL
const vec2 kernel[kernelSampleCount] = {KERNEL71};
#else
const vec2 kernel[kernelSampleCount] = vec2[kernelSampleCount](KERNEL71);
#endif
#endif

vec3 toneMap(vec3 color, float highlights){
	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	return color / (1.0 + luma * highlights);
}

vec3 bokeh(vec2 coord, vec2 texelSize, vec2 gamma, vec2 highlights){
	vec3 color = CAST3(0.0), currentColor;
	vec2 offset;
	for (int i = 0; i < kernelSampleCount; i++) {
		offset = kernel[i] * texelSize;

		color += toneMap(pow(saturate(texSample2D(g_Texture0, coord + offset).rgb), CAST3(gamma.x)), highlights.x);
	}
	return pow(toneMap(color / float(kernelSampleCount), highlights.y), CAST3(gamma.y));
}

void main(){
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord);
	vec2 depthTex = texSample2D(g_Texture1, v_TexCoord).rg;
	float depth = max(depthTex.x, depthTex.y);

#if !COC || MODE != 1
	if (depth > 0.01 && v_Aperture > 0.01) {
		albedo = vec4(bokeh(v_TexCoord, v_PixelSize * depth, v_Gamma, v_Highlights), albedo.a);
	}
#endif

	gl_FragColor = albedo;
}