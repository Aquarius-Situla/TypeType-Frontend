export const tvFaceShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D face;
    uniform float time;
    uniform float power;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      float line = floor(vUv.y * 180.0);
      float frame = floor(time * 24.0);
      float jump = step(0.97, hash(vec2(floor(time * 5.0), 3.0))) * 0.035;
      float jitter = (hash(vec2(line, frame)) - 0.5) * 0.006 + jump * step(0.6, fract(vUv.y * 2.0 + time));
      vec2 at = vec2(vUv.x + jitter, vUv.y);
      vec3 c = vec3(
        texture2D(face, at + vec2(0.004, 0.0)).r,
        texture2D(face, at).g,
        texture2D(face, at - vec2(0.004, 0.0)).b
      );
      float grain = (hash(floor(vUv * vec2(330.0, 250.0)) + frame) - 0.5) * 0.22;
      float scan = 0.82 + 0.18 * sin(vUv.y * 760.0 + time * 6.0);
      vec2 edge = vUv - 0.5;
      float vignette = 1.0 - dot(edge, edge) * 1.3;
      c = (c + grain) * scan * vignette * power * 1.25;
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
};
