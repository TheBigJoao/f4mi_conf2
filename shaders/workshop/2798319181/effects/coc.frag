// [COMBO] {"material":"Mode","combo":"MODE","type":"options","default":0,"options":{"Mask":0,"Depth of field":1}}
// [COMBO] {"material":"Autofocus","combo":"AUTOFOCUS","type":"options","default":0,"require":{"MODE":1}}
// [COMBO] {"material":"Adjust depth levels","combo":"DEPTHLEVELS","type":"options","default":0,"require":{"MODE":1}}

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"MASK","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform sampler2D g_Texture2; // {"default":"util/white","format":"r8","label":"ui_editor_properties_depth_map","mode":"depth","paintdefaultcolor":"1 1 1 1","require":{"MODE":1}}
uniform float u_aperture; // {"material":"Aperture","default":1,"range":[0,4],"group":"Lens"}
uniform float u_focusDepth; // {"material":"Focus distance","default":0.5,"range":[0.01,1],"group":"Lens"}
uniform float u_focusScale; // {"material":"Focal length","default":1,"range":[0.01,3],"group":"Lens"}
uniform float u_multiplier; // {"material":"Depth levels multiplier","default":1,"range":[0,2],"group":"Depth map"}
uniform float u_exponent; // {"material":"Exponent","default":1,"range":[0,2],"group":"Depth map"}
uniform float u_offset; // {"material":"Depth levels offset","default":1,"range":[-2,2],"group":"Depth map"}
uniform vec2 u_focusPoint; // {"default":"0.5 0.5","group":"Lens","material":"Focus point","position":true}
uniform vec2 u_depthBounds; // {"default":"0 1","group":"Depth map","linked":true,"material":"Remap","range":[-1,2]}

varying vec2 v_TexCoord;

float remapFrom01(float b1, float b2, float v) { return b1 + pow(v * (b2 - b1), u_exponent); }

void main() {
#if MASK
	float mask = texSample2D(g_Texture1, v_TexCoord).r;
#else
#define mask 1.0
#endif

#if MODE == 1
		float depth = texSample2D(g_Texture2, v_TexCoord).r;
	#if DEPTHLEVELS
		depth = u_depthBounds.x > u_depthBounds.y ? 1.0 - depth : depth;
	#endif

		if (mask > 0.001 && u_aperture > 0.001){
	#if AUTOFOCUS
			float focusDepth = texSample2D(g_Texture2, u_focusPoint).r;
		#if DEPTHLEVELS
				focusDepth = u_depthBounds.x > u_depthBounds.y ? 1.0 - focusDepth : focusDepth;
		#endif
	#else
			float focusDepth = u_focusDepth;
	#endif

	#if DEPTHLEVELS
			depth = remapFrom01(u_depthBounds.x, u_depthBounds.y, depth);
			focusDepth = remapFrom01(u_depthBounds.x, u_depthBounds.y, focusDepth);
	#endif
			depth = ((depth - focusDepth) / u_focusScale * mask) / 5.0;
			gl_FragColor = vec4(-depth, depth, 0, 0);
		} else {
			gl_FragColor = CAST4(0.0);
		}
#else 
	gl_FragColor = CAST4(mask);
#endif
}