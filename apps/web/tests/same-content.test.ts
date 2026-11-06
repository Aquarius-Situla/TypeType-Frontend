import { expect, test } from "bun:test";
import { keepSameContent } from "../src/lib/same-content";

test("keeps the previous object while the content is the same", () => {
  const first = keepSameContent(null, { volume: 0.5, captionStyles: { size: 1 } });
  const same = keepSameContent(first, { volume: 0.5, captionStyles: { size: 1 } });
  const changed = keepSameContent(same, { volume: 0.6, captionStyles: { size: 1 } });

  expect(same).toBe(first);
  expect(same.value).toBe(first.value);
  expect(changed).not.toBe(first);
  expect(changed.value.volume).toBe(0.6);
});
