import { CylinderGeometry } from "three";
import { HALL } from "../corridor/stairs-layout";

const GRAIN_COLUMNS = (480 * HALL.screenArc).toFixed(1);

export function arc(radius: number, height: number, from: number, to: number): CylinderGeometry {
  const geometry = new CylinderGeometry(radius, radius, height, 160, 1, true, from, to - from);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) uv.setX(i, 1 - uv.getX(i));
  return geometry;
}

export function screenPower(since: number | null): number {
  if (since === null || since < 250) return 0;
  if (since < 330) return 0.55;
  if (since < 900) return 0.3;
  if (since < 1500) return 0.68;
  return 0.97 + Math.random() * 0.03;
}

export const screenShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D face;
    uniform sampler2D sticks;
    uniform sampler2D clip;
    uniform float reveal;
    uniform float clipOn;
    uniform float sticksOn;
    uniform float stretch;
    uniform float snow;
    uniform float time;
    uniform float region;
    uniform float blur;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vec2((vUv.x - 0.5) / region + 0.5, vUv.y);
      float inFace = step(0.0, uv.x) * step(uv.x, 1.0);
      vec2 edge = abs(uv - 0.5) * 2.0;
      float fade = (1.0 - smoothstep(0.75, 1.0, max(edge.x, edge.y))) * inFace;
      float grain = hash(floor(vUv * vec2(${GRAIN_COLUMNS}, 520.0)) + floor(time * 24.0));
      float roll = 0.85 + 0.15 * sin(vUv.y * 900.0 + time * 40.0);
      float grey = dot(texture2D(face, uv, blur).rgb, vec3(0.299, 0.587, 0.114));
      float faceLight = pow(grey, 1.2) * 1.4 * reveal * mix(1.0, grain * 1.6, snow * 0.45) * fade;
      vec3 c = vec3(grain * roll * snow * 0.7 * (1.0 - 0.7 * reveal) + faceLight);
      c = max(c, texture2D(sticks, uv).rgb * sticksOn * fade);
      vec2 at = vec2((uv.x - 0.5) * stretch + 0.5, uv.y);
      float inside = step(0.0, at.x) * step(at.x, 1.0) * inFace;
      c = mix(c, sRGBTransferEOTF(texture2D(clip, at)).rgb * inside, clipOn);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
};
