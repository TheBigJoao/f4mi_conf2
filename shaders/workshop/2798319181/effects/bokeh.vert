// [COMBO] {"material":"Mode","combo":"MODE","type":"options","default":0,"options":{"Mask":0,"Depth of field":1}}
// [COMBO] {"material":"Anamorphic lens","combo":"ANAMORPHIC","type":"options","default":0}

uniform vec2 g_TexelSize;
uniform vec4 g_Texture0Resolution;

uniform float u_ratio; // {"material":"Ratio","default":2.39,"range":[1,4],"group":"Lens"}
uniform float u_aperture; // {"material":"Aperture","default":1,"range":[0,4],"group":"Lens"}
uniform float u_gamma; // {"material":"Gamma","default":1,"range":[1,5],"group":"Lens"}
uniform float u_lightFactor; // {"material":"Highlights","default":1,"range":[0,1],"group":"Lens"}

attribute vec3 a_Position;
attribute vec2 a_TexCoord;

varying vec2 v_TexCoord;
varying vec2 v_PixelSize;
varying float v_Aperture;
varying vec2 v_Gamma;
varying vec2 v_Highlights;

void main() {
	vec2 ratio = g_TexelSize * g_Texture0Resolution.xy;

#if MODE == 1
	v_Aperture = 15.0 * u_aperture;
#else
	v_Aperture = 3.0 * u_aperture;
#endif

#if ANAMORPHIC
	v_PixelSize = (g_TexelSize + g_TexelSize) * vec2(ratio.y / ratio.x, u_ratio) * v_Aperture;
#else
	v_PixelSize = (g_TexelSize + g_TexelSize) * vec2(ratio.y / ratio.x * v_Aperture, v_Aperture);
#endif
	
	v_Highlights = vec2(-0.999, 0.999) * u_lightFactor;
	v_Gamma = vec2(u_gamma, 1.0 / u_gamma);

	gl_Position = vec4(a_Position, 1.0);
	v_TexCoord = a_TexCoord;
}
