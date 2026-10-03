export function isTakeoutStorageQuotaError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    ((error as { name?: string }).name === "QuotaExceededError" ||
      (error as { name?: string }).name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
