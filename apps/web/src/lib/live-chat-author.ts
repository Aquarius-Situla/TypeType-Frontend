const AUTHOR_COLORS = ["#e6ac82", "#bda8ee", "#7bc7c3", "#e7a2ba", "#a9c38c", "#91b3e7", "#dbbf7a"];

export function liveChatAuthorColor(name: string) {
  let hash = 0;
  for (const character of name)
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
}

export function liveChatAvatarUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
