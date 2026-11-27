import { FlagImage } from "./flag-image";

const ENGLISH_FLAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#ffffff"/><rect y="6" width="24" height="4" fill="#d62828"/><rect x="10" width="4" height="16" fill="#d62828"/></svg>';

export function EnglishFlag(): React.JSX.Element {
  return <FlagImage svg={ENGLISH_FLAG_SVG} />;
}
