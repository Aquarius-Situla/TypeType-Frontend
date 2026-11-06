export type ContentSnapshot<T> = { key: string; value: T };

/** Keeps the previous object while its content is unchanged, so effects that depend on it stay quiet. */
export function keepSameContent<T>(
  previous: ContentSnapshot<T> | null,
  next: T,
): ContentSnapshot<T> {
  const key = JSON.stringify(next);
  return previous?.key === key ? previous : { key, value: next };
}
