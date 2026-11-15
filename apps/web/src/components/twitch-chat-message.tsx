import { proxyImage } from "../lib/proxy";
import type { ChatEmoteImage, ChatPart } from "../lib/twitch-chat-parts";
import { m } from "../paraglide/messages.js";

function EmoteImage({ image, overlay = false }: { image: ChatEmoteImage; overlay?: boolean }) {
  return (
    <img
      src={proxyImage(image.url, "card")}
      srcSet={image.url2x ? `${proxyImage(image.url2x, "card")} 2x` : undefined}
      alt={image.name}
      title={image.name}
      loading="lazy"
      decoding="async"
      className={
        overlay
          ? "pointer-events-none absolute inset-0 m-auto h-7 max-w-none"
          : "inline-block h-7 max-w-none align-middle"
      }
    />
  );
}

type Props = { parts: ChatPart[]; onLink: (href: string) => void };

export function TwitchChatMessage({ parts, onLink }: Props) {
  return parts.map((part, index) => {
    switch (part.kind) {
      case "emote":
        return part.overlays.length === 0 ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and never reorder
          <EmoteImage key={index} image={part.emote} />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and never reorder
          <span key={index} className="relative inline-block align-middle">
            <EmoteImage image={part.emote} />
            {part.overlays.map((overlay) => (
              <EmoteImage key={overlay.name} image={overlay} overlay />
            ))}
          </span>
        );
      case "link":
        return (
          <a
            // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and never reorder
            key={index}
            href={part.href}
            rel="noopener noreferrer nofollow"
            target="_blank"
            aria-label={m.twitch_link_label({ url: part.href })}
            onClick={(event) => {
              event.preventDefault();
              onLink(part.href);
            }}
            className="break-all text-accent underline underline-offset-2 hover:text-accent/80"
          >
            {part.text}
          </a>
        );
      case "mention":
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and never reorder
            key={index}
            className={`font-semibold ${part.self ? "rounded bg-accent/20 px-0.5 text-fg" : "text-fg"}`}
          >
            {part.text}
          </span>
        );
      default:
        // biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id and never reorder
        return <span key={index}>{part.text}</span>;
    }
  });
}
