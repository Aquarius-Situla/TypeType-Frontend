import { ApiError } from "./api";

export async function portabilityResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const candidate = payload as { error?: string; code?: string } | null;
    throw new ApiError(
      candidate?.error ?? response.statusText ?? "Portability request failed",
      response.status,
      candidate?.code ?? null,
    );
  }
  return payload as T;
}
