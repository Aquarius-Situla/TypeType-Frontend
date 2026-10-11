import type { MeshStandardMaterial } from "three";

export type WatcherUniforms = {
  uTurn: { value: number };
  uTilt: { value: number };
  uEyes: { value: number };
  uSway: { value: number };
};

const SHARED = `
uniform float uTurn;
uniform float uTilt;
uniform float uEyes;
uniform float uSway;
varying vec3 vRest;
const vec2 EYE = vec2(0.74, 1.7);
const float FACE_X = -0.08;
`;

const VERTEX_HELPERS = `
mat3 headRotation(float y) {
  float w = smoothstep(-2.5, -1.0, y);
  float yaw = w * (mix(uTilt * 0.3, 3.14159, uTurn) + uSway * 0.04);
  float roll = w * (uTilt * 0.16 * (1.0 - uTurn) + uSway * 0.02);
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cr = cos(roll);
  float sr = sin(roll);
  mat3 aroundY = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 aroundZ = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
  return aroundY * aroundZ;
}
`;

const HEAD_VERTEX = `
vRest = position;
{
  float front = smoothstep(0.6, 1.6, position.z);
  vec2 eye = vec2((abs(position.x - FACE_X) - EYE.x) / 0.36, (position.y - EYE.y) / 0.2);
  transformed.z -= uEyes * 0.22 * exp(-dot(eye, eye)) * front;
}
vec3 pivot = vec3(0.0, -1.0, -0.45);
transformed = headRotation(position.y) * (transformed - pivot) + pivot;
`;

const HEAD_FRAGMENT = `
{
  float ax = abs(vRest.x - FACE_X);
  float front = smoothstep(0.6, 1.6, vRest.z);

  vec2 eye = vec2((ax - EYE.x) / 0.3, (vRest.y - EYE.y) / max(0.001, 0.15 * uEyes));
  float almond = eye.y * eye.y / max(0.05, 1.0 - eye.x * eye.x) + eye.x * eye.x;
  float hole = (1.0 - smoothstep(0.7, 1.0, almond)) * front * step(0.01, uEyes);
  float lids = (1.0 - smoothstep(1.0, 3.2, almond)) * front * uEyes * 0.45;
  diffuseColor.rgb *= 1.0 - lids;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.004), hole);

  float collar = -2.3 + 0.35 * smoothstep(1.0, 2.5, ax) - 0.25 * smoothstep(0.0, 1.0, vRest.z);
  float wool = 1.0 - smoothstep(collar - 0.08, collar + 0.04, vRest.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.045, 0.04), wool);
}
`;

export function makeWatcherMaterial(material: MeshStandardMaterial): WatcherUniforms {
  const uniforms: WatcherUniforms = {
    uTurn: { value: 0 },
    uTilt: { value: 0 },
    uEyes: { value: 0 },
    uSway: { value: 0 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SHARED}\n${VERTEX_HELPERS}`)
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nobjectNormal = headRotation(position.y) * objectNormal;",
      )
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${HEAD_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${SHARED}`)
      .replace("#include <map_fragment>", `#include <map_fragment>\n${HEAD_FRAGMENT}`);
  };
  material.customProgramCacheKey = (): string => "watcher";
  return uniforms;
}
