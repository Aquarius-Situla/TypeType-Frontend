import { FlagImage } from "./flag-image";

const STAR_POINTS =
  "0,-1 0.2245,-0.309 0.9511,-0.309 0.3633,0.118 0.5878,0.809 0,0.382 -0.5878,0.809 -0.3633,0.118 -0.9511,-0.309 -0.2245,-0.309";

const STAR_TRANSFORMS = [
  "translate(5, 5) scale(3)",
  "translate(10, 2) rotate(239.04)",
  "translate(12, 4) rotate(261.87)",
  "translate(12, 7) rotate(285.95)",
  "translate(10, 9) rotate(308.66)",
];

const SIMPLIFIED_CHINESE_FLAG_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">',
  '<rect width="30" height="20" fill="#de2910"/>',
  ...STAR_TRANSFORMS.map(
    (transform) => `<polygon points="${STAR_POINTS}" fill="#ffde00" transform="${transform}"/>`,
  ),
  "</svg>",
].join("");

export function SimplifiedChineseFlag(): React.JSX.Element {
  return <FlagImage svg={SIMPLIFIED_CHINESE_FLAG_SVG} />;
}
