interface Navigator {
  readonly keyboard?: { getLayoutMap(): Promise<ReadonlyMap<string, string>> };
}
