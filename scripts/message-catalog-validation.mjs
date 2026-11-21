function placeholders(value) {
  return [...value.matchAll(/\{([A-Za-z0-9_.-]+)\}/g)].map((match) => match[1]).sort();
}

export function validateMessageCatalog(sourceLocale, locale, { partial = false } = {}) {
  const failures = [];
  const expectedKeys = Object.keys(sourceLocale).sort();
  const actualKeys = Object.keys(locale).sort();

  for (const key of expectedKeys) {
    if (!(key in locale)) {
      if (!partial) failures.push(`missing message key ${key}`);
      continue;
    }

    const value = locale[key];
    if (typeof value !== "string") {
      failures.push(`message value must be text for ${key}`);
      continue;
    }
    if (value.trim().length === 0) {
      if (!partial) failures.push(`empty message value for ${key}`);
      continue;
    }
    if (key === "$schema" && value !== sourceLocale[key]) {
      failures.push("message schema must match the source catalog");
      continue;
    }
    if (JSON.stringify(placeholders(sourceLocale[key])) !== JSON.stringify(placeholders(value))) {
      failures.push(`placeholder mismatch for ${key}`);
    }
  }

  if (partial) return failures;
  for (const key of actualKeys) {
    if (!(key in sourceLocale)) failures.push(`unknown message key ${key}`);
  }

  return failures;
}
