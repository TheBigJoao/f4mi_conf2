// [COMBO] {"material":"Anamorphic lens","combo":"ANAMORPHIC","type":"options","default":0}
// [COMBO] {"material":"Quality","combo":"QUALITY","type":"options","default":2,"options":{"Ultra":0,"High":1,"Medium":2,"Low":3}}

uniform mat4 g_ModelViewProjectionMatrix;
uniform vec2 g_TexelSize;
uniform vec4 g_Texture0Resolution;

uniform float u_ratio; // {"material":"Ratio","default":2.39,"range":[1,4],"group":"Lens"}
uniform float u_aperture; // {"material":"Aperture","default":1,"range":[0,4],"group":"Lens"}

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec2 v_TexCoord;
varying vec2 v_PixelSize;
varying float qualityNormalizer;

void main() {
	vec2 ratio = g_TexelSize * g_Texture0Resolution.xy;

	qualityNormalizer = (QUALITY + 1.0) * 0.6;

#if ANAMORPHIC
	v_PixelSize = (g_TexelSize + g_TexelSize) * vec2(ratio.y / ratio.x, u_ratio) * u_aperture;
#else
	v_PixelSize = (g_TexelSize + g_TexelSize) * vec2(ratio.y / ratio.x * u_aperture, u_aperture);
#endif

#if PRECISE
	gl_Position = vec4(a_Position, 1.0);
#else
	#if VERTICAL
		gl_Position = mul(vec4(a_Position, 1.0), g_ModelViewProjectionMatrix);
	#else
		gl_Position = vec4(a_Position, 1.0);
	#endif
#endif

	v_TexCoord = a_TexCoord;
}
