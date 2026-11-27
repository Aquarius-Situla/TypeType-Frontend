function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Renders a flag as an `<img>` so browser dark-mode / smart-invert engines cannot recolor white bands. */
export function FlagImage({ svg }: { svg: string }): React.JSX.Element {
  return (
    <img
      src={toSvgDataUri(svg)}
      alt=""
      aria-hidden="true"
      width={24}
      height={16}
      draggable={false}
      className="block h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-black/15"
    />
  );
}
