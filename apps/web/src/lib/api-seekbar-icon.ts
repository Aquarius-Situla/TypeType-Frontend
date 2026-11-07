import { ApiError } from "./api";
import { authed } from "./authed";
import { API_BASE as BASE } from "./env";

export async function uploadSeekbarIcon(file: File): Promise<string> {
  const res = await authed(`${BASE}/profile/seekbar-icon`, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const body = await res.json().catch(() => null);
  if (
    !res.ok ||
    !body ||
    typeof body !== "object" ||
    !("seekbarIconUrl" in body) ||
    typeof body.seekbarIconUrl !== "string"
  ) {
    throw new ApiError("Failed to upload seekbar icon", res.status);
  }
  return body.seekbarIconUrl;
}

export async function deleteSeekbarIcon(): Promise<void> {
  const res = await authed(`${BASE}/profile/seekbar-icon`, { method: "DELETE" });
  if (res.status !== 204) throw new ApiError("Failed to delete seekbar icon", res.status);
}
