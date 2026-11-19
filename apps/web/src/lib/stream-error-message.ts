import { m } from "../paraglide/messages.js";
import { ApiError } from "./api";
import { isTemporaryApiError } from "./api-retry";

const OVERLOAD_CODES = new Set(["provider_rate_limited", "provider_paced", "rate_limited"]);

const PERMANENT_CODES = new Set([
  "content_unavailable",
  "private_content",
  "geographic_restriction",
]);

export function resolveStreamErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "provider_access_blocked":
      return m.ui_error_provider_blocked();
    case "geographic_restriction":
      return m.ui_error_region_restricted();
    case "no_playable_streams":
      return m.ui_error_no_playable_stream();
    case "private_content":
    case "content_unavailable":
      return m.ui_error_private_video();
    case "age_restricted":
      return m.ui_error_age_restricted();
    case "provider_rate_limited":
    case "provider_paced":
    case "upstream_timeout":
      return m.ui_error_temporarily_unavailable();
    case "token_service_unavailable":
      return m.ui_error_token_service_unavailable();
    case "provider_data_missing":
    case "media_handle_unavailable":
      return m.ui_error_stream_unavailable();
  }

  const message = error.message.toLowerCase();
  if (isProviderAccessBlockedMessage(message)) return m.ui_error_provider_blocked();
  if (isRegionRestrictedMessage(message)) return m.ui_error_region_restricted();
  if (isTemporaryApiError(error)) return m.ui_error_temporarily_unavailable();
  if (error.status === 422) return m.ui_error_stream_unavailable();
  return null;
}

export function isPermanentlyUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && PERMANENT_CODES.has(error.code ?? "");
}

// "Busy" only when the server refuses for load; a video still being prepared or a token container that cannot
// reach YouTube is not an overload, and the second one needs its owner to look at it.
export function streamRetryNotice(error: unknown, retrying: boolean): string | undefined {
  if (!retrying || !(error instanceof ApiError) || !isTemporaryApiError(error)) return undefined;
  if (error.code === "token_service_unavailable") return m.ui_error_token_service_unavailable();
  if (error.status === 429 || OVERLOAD_CODES.has(error.code ?? "")) {
    return m.ui_error_temporarily_unavailable_retrying();
  }
  return m.ui_notice_preparing_retrying();
}

function isProviderAccessBlockedMessage(message: string): boolean {
  return (
    message.includes("ip is blocked") ||
    message.includes("captcha") ||
    message.includes("recaptcha") ||
    message.includes("not a bot") ||
    message.includes("bot check") ||
    message.includes("anti-bot")
  );
}

function isRegionRestrictedMessage(message: string): boolean {
  return (
    message.includes("not available in your country") ||
    message.includes("not available in your region") ||
    message.includes("only available in") ||
    message.includes("same region") ||
    message.includes("geographic restriction")
  );
}
