import { FlagImage } from "./flag-image";

const FRENCH_FLAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#1b4fa3"/><rect x="8" width="16" height="16" fill="#ffffff"/><rect x="16" width="8" height="16" fill="#e33a3a"/></svg>';

export function FrenchFlag(): React.JSX.Element {
  return <FlagImage svg={FRENCH_FLAG_SVG} />;
}
