import { describe, expect, test } from "bun:test";
import { decodeJwtPayload, isTokenExpired } from "../src/lib/jwt";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.signature`;
}

describe("JWT expiration utility", () => {
  test("returns null and false for malformed or non-JWT tokens", () => {
    expect(decodeJwtPayload("not-a-token")).toBeNull();
    expect(isTokenExpired("not-a-token")).toBe(false);
    expect(decodeJwtPayload("header.body")).toBeNull();
    expect(isTokenExpired("header.body")).toBe(false);
  });

  test("handles tokens without exp claim", () => {
    const token = makeJwt({ sub: "user123" });
    expect(decodeJwtPayload(token)).toEqual({ sub: "user123" });
    expect(isTokenExpired(token)).toBe(false);
  });

  test("detects unexpired token", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const token = makeJwt({ sub: "user123", exp: futureExp });
    expect(isTokenExpired(token)).toBe(false);
  });

  test("detects expired token", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    const token = makeJwt({ sub: "user123", exp: pastExp });
    expect(isTokenExpired(token)).toBe(true);
  });

  test("considers token expiring within buffer seconds as expired", () => {
    const almostExp = Math.floor(Date.now() / 1000) + 5; // 5 seconds from now
    const token = makeJwt({ sub: "user123", exp: almostExp });
    // Default buffer is 10 seconds, so 5 seconds remaining should be considered expired
    expect(isTokenExpired(token, 10)).toBe(true);
    // But with 0 buffer, it is not yet expired
    expect(isTokenExpired(token, 0)).toBe(false);
  });
});
