import { FlagImage } from "./flag-image";

const GERMAN_FLAG_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 3" preserveAspectRatio="none"><rect width="3" height="3" fill="#1f1f1f"/><rect y="1" width="3" height="2" fill="#d21f26"/><rect y="2" width="3" height="1" fill="#f5c542"/></svg>';

export function GermanFlag(): React.JSX.Element {
  return <FlagImage svg={GERMAN_FLAG_SVG} />;
}
