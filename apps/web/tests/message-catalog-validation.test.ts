import { describe, expect, test } from "bun:test";
import { validateMessageCatalog } from "../../../scripts/message-catalog-validation.mjs";

const source = {
  $schema: "https://example.com/messages.schema.json",
  greeting: "Hello {name}",
  title: "Title",
};

describe("message catalog validation", () => {
  test("accepts a complete catalog with matching placeholders", () => {
    expect(
      validateMessageCatalog(source, {
        $schema: source.$schema,
        greeting: "Bonjour {name}",
        title: "Titre",
      }),
    ).toEqual([]);
  });

  test("rejects empty and non-text message values without duplicate placeholder errors", () => {
    expect(
      validateMessageCatalog(source, {
        $schema: source.$schema,
        greeting: "  ",
        title: null,
      }),
    ).toEqual(["empty message value for greeting", "message value must be text for title"]);
  });

  test("checks only the translated entries of a partial catalog", () => {
    expect(
      validateMessageCatalog(
        source,
        { $schema: source.$schema, greeting: "Bonjour", title: " ", extra: "Unexpected" },
        { partial: true },
      ),
    ).toEqual(["placeholder mismatch for greeting"]);
  });

  test("rejects missing, unknown and mismatched catalog entries", () => {
    expect(
      validateMessageCatalog(source, {
        $schema: "https://example.com/other.schema.json",
        greeting: "Bonjour",
        extra: "Unexpected",
      }),
    ).toEqual([
      "message schema must match the source catalog",
      "placeholder mismatch for greeting",
      "missing message key title",
      "unknown message key extra",
    ]);
  });
});
