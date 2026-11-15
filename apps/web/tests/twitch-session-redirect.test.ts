import { expect, test } from "bun:test";
import { requiresAuth, sanitizeRedirect } from "../src/lib/auth-routes";

test("the Twitch session page asks guests to sign in first", () => {
  expect(requiresAuth("/twitch-session")).toBe(true);
});

test("signing in returns to the Twitch session with its channel only", () => {
  expect(sanitizeRedirect("/twitch-session")).toBe("/twitch-session");
  expect(sanitizeRedirect("/twitch-session?channel=fps_shaka")).toBe(
    "/twitch-session?channel=fps_shaka",
  );
  expect(sanitizeRedirect("/twitch-session?channel=a/../b")).toBe("/");
  expect(sanitizeRedirect("/twitch-session?channel=fps_shaka&next=//evil.example")).toBe("/");
});
