import { type ReactNode, useState } from "react";
import {
  parseRichTextMarkup,
  parseTextSegments,
  type RichTextNode,
  sameVideoTimestampSeconds,
} from "../lib/rich-text";
import { ExternalLinkModal } from "./external-link-modal";

type RichTextProps = {
  text: string;
  videoUrl?: string;
  onSeekTimestamp?: (seconds: number) => void;
};

export function RichText({ text, videoUrl, onSeekTimestamp }: RichTextProps) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const nodes = parseRichTextMarkup(text);

  function renderNodes(
    children: RichTextNode[],
    keyPrefix: string,
    insideLink = false,
  ): ReactNode[] {
    return children.flatMap((node, index) => renderNode(node, `${keyPrefix}-${index}`, insideLink));
  }

  function renderNode(node: RichTextNode, key: string, insideLink: boolean): ReactNode[] {
    if (node.type === "text") {
      if (insideLink) return [<span key={key}>{node.value}</span>];
      return parseTextSegments(node.value, `${key}-`).map((segment) =>
        segment.type === "text" ? (
          <span key={segment.id}>{segment.value}</span>
        ) : segment.type === "url" ? (
          <a
            key={segment.id}
            href={segment.value}
            onClick={(event) => {
              event.preventDefault();
              const seconds = videoUrl ? sameVideoTimestampSeconds(segment.value, videoUrl) : null;
              if (seconds !== null && onSeekTimestamp) {
                onSeekTimestamp(seconds);
                return;
              }
              setPendingUrl(segment.value);
            }}
            className="text-accent hover:text-accent-strong underline underline-offset-2 transition-colors break-all text-left align-baseline"
          >
            {segment.value}
          </a>
        ) : onSeekTimestamp ? (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSeekTimestamp(segment.seconds)}
            className="text-accent hover:text-accent-strong underline underline-offset-2 transition-colors"
          >
            {segment.value}
          </button>
        ) : (
          <span key={segment.id}>{segment.value}</span>
        ),
      );
    }
    if (node.type === "break") return [<br key={key} />];
    if (node.type === "link") {
      if (insideLink) return renderNodes(node.children, key, true);
      const seconds = videoUrl ? sameVideoTimestampSeconds(node.href, videoUrl) : null;
      if (seconds !== null && onSeekTimestamp) {
        return [
          <button
            key={key}
            type="button"
            onClick={() => onSeekTimestamp(seconds)}
            className="text-accent hover:text-accent-strong underline underline-offset-2 transition-colors"
          >
            {renderNodes(node.children, key, true)}
          </button>,
        ];
      }
      return [
        <a
          key={key}
          href={node.href}
          onClick={(event) => {
            event.preventDefault();
            setPendingUrl(node.href);
          }}
          className="text-accent hover:text-accent-strong underline underline-offset-2 transition-colors break-all text-left align-baseline"
        >
          {renderNodes(node.children, key, true)}
        </a>,
      ];
    }
    const children = renderNodes(node.children, key, insideLink);
    switch (node.tag) {
      case "strong":
        return [<strong key={key}>{children}</strong>];
      case "em":
        return [<em key={key}>{children}</em>];
      case "u":
        return [<u key={key}>{children}</u>];
      case "s":
        return [<s key={key}>{children}</s>];
      case "code":
        return [<code key={key}>{children}</code>];
      case "kbd":
        return [<kbd key={key}>{children}</kbd>];
      case "mark":
        return [<mark key={key}>{children}</mark>];
    }
  }

  return (
    <span>
      {renderNodes(nodes, "rich-text")}
      {pendingUrl && (
        <ExternalLinkModal
          url={pendingUrl}
          onConfirm={() => {
            window.open(pendingUrl, "_blank", "noopener,noreferrer");
            setPendingUrl(null);
          }}
          onCancel={() => setPendingUrl(null)}
        />
      )}
    </span>
  );
}
