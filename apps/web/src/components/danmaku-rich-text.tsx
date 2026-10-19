import { useState } from "react";
import { parseDanmakuRichText } from "../lib/danmaku-rich-text";

const NO_FAILED_EMOTES: ReadonlySet<string> = new Set();

export function DanmakuRichText({ text, fontSize }: { text: string; fontSize: number }) {
  const [failed, setFailed] = useState(NO_FAILED_EMOTES);
  const tokens = parseDanmakuRichText(text);
  if (tokens.length === 1 && tokens[0].type === "text") return <>{text}</>;
  return (
    <>
      {tokens.map((token) =>
        token.type === "text" ? (
          <span key={`text-${token.start}`}>{token.text}</span>
        ) : failed.has(token.src) ? (
          <span key={`failed-${token.start}`}>{token.code}</span>
        ) : (
          <img
            key={`emote-${token.start}`}
            src={token.src}
            alt={token.code}
            referrerPolicy="no-referrer"
            draggable={false}
            style={{
              height: `${fontSize}px`,
              width: "auto",
              maxWidth: `${fontSize * 3}px`,
              verticalAlign: "middle",
            }}
            onError={() => {
              setFailed((previous) => {
                const next = new Set(previous);
                next.add(token.src);
                return next;
              });
            }}
          />
        ),
      )}
    </>
  );
}
