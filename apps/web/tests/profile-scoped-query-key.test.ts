import { expect, test } from "bun:test";
import { profileScopedQueryKey } from "../src/lib/profile-scoped-query-key";

test("recommender query keys are isolated by active profile", () => {
  const base = ["recommender", "settings"] as const;
  expect(profileScopedQueryKey(base, "profile-a")).not.toEqual(
    profileScopedQueryKey(base, "profile-b"),
  );
});
