import { AdditiveBlending, Color, CylinderGeometry, DoubleSide, Mesh, ShaderMaterial } from "three";

export type LightShaft = { mesh: Mesh; set: (level: number) => void; dispose: () => void };

const vertexShader = `
  uniform float height;
  varying float vHeight;
  varying float vEdge;
  void main() {
    vHeight = position.y / height + 0.5;
    vec4 world = modelViewMatrix * vec4(position, 1.0);
    vec3 toEye = normalize(-world.xyz);
    vec3 side = normalize(normalMatrix * normal);
    vEdge = abs(dot(toEye, side));
    gl_Position = projectionMatrix * world;
  }
`;

const fragmentShader = `
  uniform vec3 tint;
  uniform float level;
  varying float vHeight;
  varying float vEdge;
  void main() {
    float fall = pow(1.0 - vHeight, 1.6) * 0.85 + 0.15;
    gl_FragColor = vec4(tint * level * fall * vEdge * vEdge, 1.0);
  }
`;

export function createLightShaft(top: number, bottom: number, height: number): LightShaft {
  const geometry = new CylinderGeometry(top, bottom, height, 40, 1, true);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      height: { value: height },
      tint: { value: new Color(0xb9c8e6) },
      level: { value: 0 },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  const mesh = new Mesh(geometry, material);
  return {
    mesh,
    set(level) {
      material.uniforms.level.value = level;
      mesh.visible = level > 0;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
