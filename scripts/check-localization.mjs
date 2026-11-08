import fs from "node:fs";
import path from "node:path";
import {
  allowedFiles,
  allowedTechnicalText,
  allowedText,
  helperSourceFiles,
  propertySourceFiles,
} from "./localization-source-rules.mjs";
import { validateMessageCatalog } from "./message-catalog-validation.mjs";

const root = process.cwd();
const toPosix = (file) => path.relative(root, file).replaceAll("\\", "/");
const messagesDir = path.join(root, "apps/web/messages");
const sourceDir = path.join(root, "apps/web/src");
const sourceLocale = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const sourceMessageKeys = Object.keys(sourceLocale).filter((key) => key !== "$schema");
const failures = [];

function addFailure(file, line, message) {
  failures.push(`${toPosix(file)}:${line}: ${message}`);
}

for (const fileName of fs.readdirSync(messagesDir).filter((name) => name.endsWith(".json"))) {
  const file = path.join(messagesDir, fileName);
  const locale = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const failure of validateMessageCatalog(sourceLocale, locale)) addFailure(file, 1, failure);
}

const visibleAttributes =
  /\b(?:aria-label|ariaLabel|title|placeholder|alt|label|description|message|subtitle|heading|confirmLabel|emptyLabel)\s*=\s*(["'])(.*?)\1/g;
const visibleProperties =
  /\b(?:label|description|message|subtitle|heading|confirmLabel|emptyLabel)\s*:\s*(["'])([^"'\n]*)\1/g;
const staticToast =
  /\b(?:setToast|onToast|setError|setBannerMessage|setMessage)\(\s*(["'`])([^"'`\n]*)\1/g;
const visibleExpressionLiteral =
  /(?<![.\w-])(?:aria-label|ariaLabel|title|placeholder|alt|label|description|message|subtitle|heading|confirmLabel|emptyLabel)\s*=\s*\{[^\n]*?["'`]([^"'`\n]+)["'`]/g;
const visibleVariableLiteral =
  /\b(?:const|let)\s+(?:label|stateLabel|headingText|titleText|messageText|descriptionText|count|countLabel)\s*=\s*[^;\n]*?["'`]([^"'`\n]+)["'`]/g;
const visibleFallbackLiteral =
  /\b(?:title|label|placeholder|alt|ariaLabel)\s*[:=][^;\n]*?\?\?\s*(["'`])([^"'`\n]+)\1/g;
const jsxConditionalLiteral =
  /\{[^{}\n]*\?\s*(["'`])([^"'`\n]+)\1\s*:\s*(["'`])([^"'`\n]+)\3[^{}\n]*\}/g;
const jsxText = />\s*([^<>{}\n]*[A-Za-zÀ-ÿ][^<>{}\n]*)\s*<\/[A-Za-z][^<>\n]*>/g;
const helperReturnLiteral = /\breturn\s+(["'`])([^"'`\n]*)\1/g;

function isAllowed(value, file, kind) {
  const text = value.trim();
  const plainText = text.replace(/\$\{[^}]*\}/g, "").trim();
  const relative = toPosix(file);
  if (!text || allowedText.has(text) || allowedFiles.has(relative)) return true;
  if (!plainText || /^[():,./\s-]+$/.test(plainText)) return true;
  if (allowedTechnicalText.get(relative)?.has(text)) return true;
  if (/^(?:https?:\/\/|mailto:|\/|\.|#)/.test(text)) return true;
  if (kind === "attribute" && /^(?:https?:\/\/|[\w.-]+\.[A-Za-z]{2,}|https?:\/\/\.\.\.)/.test(text))
    return true;
  if (/^(?:[A-Za-z_$][\w$]*|[A-Z_][A-Z0-9_]+)$/.test(text)) return false;
  return false;
}

function isCodeFragment(value) {
  return /[=(){}]|=>|&&|\|\||===|!==|\?\s*[^.]/.test(value) || /^[):]/.test(value.trim());
}

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "paraglide") scan(file);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const relative = toPosix(file);
    if (allowedFiles.has(relative)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(visibleAttributes)) {
      const line = content.slice(0, match.index).split("\n").length;
      if (!isAllowed(match[2], file, "attribute"))
        addFailure(file, line, `hardcoded visible attribute: ${match[2]}`);
    }
    if (file.endsWith(".tsx")) {
      for (const match of content.matchAll(jsxText)) {
        const line = content.slice(0, match.index).split("\n").length;
        if (!isCodeFragment(match[1]) && !isAllowed(match[1], file, "jsx")) {
          addFailure(file, line, `hardcoded JSX text: ${match[1].trim()}`);
        }
      }
    }
    if (file.endsWith(".tsx") || propertySourceFiles.has(relative)) {
      for (const match of content.matchAll(visibleProperties)) {
        const line = content.slice(0, match.index).split("\n").length;
        if (!isAllowed(match[2], file, "property"))
          addFailure(file, line, `hardcoded visible property: ${match[2]}`);
      }
    }
    for (const match of content.matchAll(staticToast)) {
      const line = content.slice(0, match.index).split("\n").length;
      if (!match[2].includes("m.") && !isAllowed(match[2], file, "call")) {
        addFailure(file, line, `hardcoded toast/error: ${match[2]}`);
      }
    }
    for (const match of content.matchAll(visibleExpressionLiteral)) {
      const line = content.slice(0, match.index).split("\n").length;
      if (match[0].includes("className=")) continue;
      if (!isAllowed(match[1], file, "expression")) {
        addFailure(file, line, `hardcoded visible expression: ${match[1]}`);
      }
    }
    for (const match of content.matchAll(visibleVariableLiteral)) {
      const line = content.slice(0, match.index).split("\n").length;
      if (match[0].includes(".split(")) continue;
      if (!isAllowed(match[1], file, "expression")) {
        addFailure(file, line, `hardcoded visible variable: ${match[1]}`);
      }
    }
    for (const match of content.matchAll(visibleFallbackLiteral)) {
      const line = content.slice(0, match.index).split("\n").length;
      if (!isAllowed(match[2], file, "expression")) {
        addFailure(file, line, `hardcoded visible fallback: ${match[2]}`);
      }
    }
    if (helperSourceFiles.has(relative)) {
      for (const match of content.matchAll(helperReturnLiteral)) {
        const line = content.slice(0, match.index).split("\n").length;
        if (match[2].includes("${") || !match[2].includes(" ")) continue;
        if (!isAllowed(match[2], file, "return")) {
          addFailure(file, line, `hardcoded helper return: ${match[2]}`);
        }
      }
    }
    for (const match of content.matchAll(jsxConditionalLiteral)) {
      const line = content.slice(0, match.index).split("\n").length;
      const sourceLine = content.split("\n")[line - 1] ?? "";
      if (!file.endsWith(".tsx")) continue;
      if (match[0].includes("className=") || sourceLine.includes("className")) continue;
      if (!sourceLine.includes(">{") && !/^\s*\{/.test(sourceLine)) continue;
      for (const value of [match[2], match[4]]) {
        if (!isAllowed(value, file, "expression")) {
          addFailure(file, line, `hardcoded JSX conditional: ${value}`);
        }
      }
    }
  }
}

scan(sourceDir);

if (failures.length > 0) {
  console.error(`Localization check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Localization check passed (${sourceMessageKeys.length} message keys).`);
