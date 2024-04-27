#include "common.h"
#include "common_blending.h"

// [COMBO] {"material":"ui_editor_properties_blend_mode","combo":"BLENDMODE","type":"imageblending","default":0}
// [COMBO] {"material":"Operator","combo":"TONEMAP","type":"options","default":0,"options":{"Linear":0,"Exponential":1,"Logarithmic":2,"Reinhard":3,"Luminance based Reinhard":4,"RomBinDaHouse":5,"Filmic":6,"Uncharted 2":7,"ACES":8,"Color normalization":9,"Color perception normalization":10}}
// [COMBO] {"material":"Adjust display gamma","combo":"GAMMA","type":"options","default":0}

uniform float u_alpha; // {"material":"Opacity","default":1,"range":[0, 1]}
uniform float u_displayInitGamma; // {"material":"Initial display gamma","default":2.2,"range":[0,16]}
uniform float u_displayGamma; // {"material":"Corrected display gamma","default":2.2,"range":[0,16]}

uniform float u_whiteAdjustment; // {"material":"White level adjustment","default":2,"range":[0,10]}
uniform float u_exposureAdjustment; // {"material":"Exposure adjustment","default":1,"range":[0,2]}
uniform float u_lumaSaturation; // {"material":"Luminance saturation","default":1,"range":[1,3]}
uniform float u_shoulderStrength; // {"material":"Shoulder strength","default":0.15,"range":[0,1]}
uniform float u_linearStrength; // {"material":"Linear strength","default":0.5,"range":[0,1]}
uniform float u_linearAngle; // {"material":"Linear angle","default":0.1,"range":[0,1]}
uniform float u_toeStrength; // {"material":"Toe strength","default":0.2,"range":[0,1]}
uniform float u_toeNumerator; // {"material":"Toe numerator","default":0.02,"range":[0,1]}
uniform float u_toeDenominator; // {"material":"Toe denominator","default":0.3,"range":[0,1]}
uniform float u_colorNormalize; // {"material":"Factor","default":1,"range":[-1,2]}

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"MASK","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"0 0 0 1"}

varying vec4 v_TexCoord;

#if GAMMA
#define startGamma u_displayInitGamma
#define endGamma u_displayGamma
#else
#define startGamma 2.2
#define endGamma 2.2
#endif

#if GLSL
#define logOf10 2.302585092994
float log10(float x) { return log(x) / logOf10; }
#endif

const vec3 LUMINANCE_FACTOR = vec3(0.2126, 0.7152, 0.0722);
const vec3 NORMALIZED_LUMINANCE_FACTOR= normalize(LUMINANCE_FACTOR);
#if TONEMAP == 8
const mat3 aces_input_matrix = mat3(
	0.613097, 0.339523, 0.047379,
	0.070194, 0.916354, 0.013452,
	0.020616, 0.109570, 0.869815
);
const mat3 aces_output_matrix = mat3(
	1.705052, -0.621792, -0.083258,
	-0.130257, 1.140805, -0.010547,
	-0.024004, -0.128969, 1.152972
);
#endif

#if TONEMAP == 1
vec3 exponential(vec3 color) {
	color *= u_exposureAdjustment;
	float luma = dot(color, LUMINANCE_FACTOR);
	float toneMappedLuminance = 1.0 - exp(-luma / u_whiteAdjustment);
	return toneMappedLuminance * pow(color / luma, CAST3(u_lumaSaturation));
}
#endif

#if TONEMAP == 2
vec3 logarithmic(vec3 color) {
	color *= u_exposureAdjustment;
	float luma = dot(color, LUMINANCE_FACTOR);
	float toneMappedLuminance = log10(1.0 + luma) / log10(1.0 + u_whiteAdjustment);
	return toneMappedLuminance * pow(color / luma, CAST3(u_lumaSaturation));
}
#endif

#if TONEMAP == 3
vec3 reinhard(vec3 color) {
	color *= u_exposureAdjustment;
	vec3 whiteLevel = (1.0 + color) / (u_whiteAdjustment * u_whiteAdjustment);
	return color * whiteLevel / (1.0 + color);
}
#endif

#if TONEMAP == 4
vec3 lumaBasedReinhard(vec3 color) {
	color *= u_exposureAdjustment;
	float luma = dot(color, LUMINANCE_FACTOR);
	float whiteLevel = (1.0 + luma) / (u_whiteAdjustment * u_whiteAdjustment);
	float toneMappedLuma = luma * whiteLevel / (1.0 + luma);
	return color * toneMappedLuma / luma;
}
#endif

#if TONEMAP == 5
vec3 RomBinDaHouse(vec3 color) {
	color *= u_exposureAdjustment;
	return exp(-1.0 / (2.72 * color + 0.15));
}
#endif

#if TONEMAP == 6
vec3 filmic(vec3 color) {
	color = max(CAST3(0.0), color - 0.004) * u_exposureAdjustment;
	return (color * (6.2 * color + 0.5)) / (u_whiteAdjustment * color * (6.2 * color + 1.7) + 0.06);
}
#endif

#if TONEMAP == 7
vec3 Uncharted2(vec3 color) {
	color *= u_exposureAdjustment;
	#define A u_shoulderStrength
	#define B u_linearStrength
	#define C u_linearAngle
	#define D u_toeStrength
	#define E u_toeNumerator
	#define F u_toeDenominator
	#define W u_whiteAdjustment
	color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
	float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	return color / white;
}
#endif

#if TONEMAP == 8
vec3 ACES(vec3 color) {
	color = mul(aces_input_matrix, color);
	vec3 a = color * u_exposureAdjustment * (color + 0.0245786) - 0.000090537;
	vec3 b = color * u_whiteAdjustment * (0.983729 * color + 0.4329510) + 0.238081;
	return mul(aces_output_matrix, a / b);
}
#endif

#if TONEMAP == 10
vec3 colorPerception(vec3 color) {
	float luma = dot(normalize(color), NORMALIZED_LUMINANCE_FACTOR);
	luma = (1.0 - luma) * u_colorNormalize + 1.0;
	return color * u_exposureAdjustment * luma;
}
#endif

void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
#if MASK
	float mask = texSample2D(g_Texture1, v_TexCoord.xy).r;
#else
	#define mask 1.0
#endif

	if (mask > 0.001 && u_alpha > 0.001 && albedo.a > 0.001) {
		vec4 baseAlbedo = albedo;
		albedo.rgb = pow(albedo.rgb, CAST3(startGamma));

#if TONEMAP == 0
		albedo.rgb *= u_exposureAdjustment;
#endif
#if TONEMAP == 1
		albedo.rgb = exponential(albedo.rgb);
#endif
#if TONEMAP == 2
		albedo.rgb = logarithmic(albedo.rgb);
#endif
#if TONEMAP == 3
		albedo.rgb = reinhard(albedo.rgb);
#endif
#if TONEMAP == 4
		albedo.rgb = lumaBasedReinhard(albedo.rgb);
#endif
#if TONEMAP == 5
		albedo.rgb = RomBinDaHouse(albedo.rgb);
#endif
#if TONEMAP == 6
		albedo.rgb = filmic(albedo.rgb);
#endif
#if TONEMAP == 7
		albedo.rgb = Uncharted2(albedo.rgb);
#endif
#if TONEMAP == 8
		albedo.rgb = ACES(albedo.rgb);
#endif
#if TONEMAP == 9
		albedo.rgb = normalize(albedo.rgb) * u_exposureAdjustment;
#endif
#if TONEMAP == 10
		albedo.rgb = colorPerception(albedo.rgb);
#endif

#if TONEMAP != 6
		albedo.rgb = pow(albedo.rgb, CAST3(1.0 / startGamma));
#endif

		albedo.rgb = ApplyBlending(BLENDMODE, baseAlbedo.rgb, albedo.rgb, mask * albedo.a * u_alpha);
		albedo.rgb = pow(albedo.rgb, CAST3(2.2 / endGamma));
		albedo.rgb = mix(baseAlbedo.rgb, albedo.rgb, mask * u_alpha);
	}

	gl_FragColor = albedo;
}