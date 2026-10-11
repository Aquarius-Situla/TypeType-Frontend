export function profileScopedQueryKey<T extends readonly unknown[]>(
  queryKey: T,
  profileId: string | null,
): readonly [...T, string | null] {
  return [...queryKey, profileId] as [...T, string | null];
}
