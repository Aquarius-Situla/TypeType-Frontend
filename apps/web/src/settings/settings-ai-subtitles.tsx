import { useState } from "react";
import { Toast } from "../components/toast";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { callLlmChat } from "../lib/ai-subtitles";
import { LANGUAGES } from "../lib/languages";
import { m } from "../paraglide/messages.js";
import { useAiSubtitlesStore } from "../stores/ai-subtitles-store";

const PRESETS = [
  {
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  {
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  {
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct",
  },
  {
    name: "Ollama",
    endpoint: "http://localhost:11434/v1",
    model: "qwen2.5:7b",
  },
];

const TARGET_CODES = new Set(["zh", "en", "ja", "ko", "de", "fr", "es"]);
const targetLanguages = LANGUAGES.filter((l) => TARGET_CODES.has(l.code));

export function SettingsAiSubtitles() {
  const { locale } = useInterfaceLocale();
  const {
    endpoint,
    apiKey,
    model,
    targetLanguage,
    setEndpoint,
    setApiKey,
    setModel,
    setTargetLanguage,
    clearCache,
    cachedTracks,
  } = useAiSubtitlesStore();

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setEndpoint(p.endpoint);
    setModel(p.model);
    setToastMessage(p.name);
    setTimeout(() => setToastMessage(null), 2000);
  }

  async function handleTestConnection() {
    if (!endpoint) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await callLlmChat(endpoint, apiKey, model, [
        {
          role: "user",
          content: 'Translate the word "Hello" into Chinese. Return only the translated word.',
        },
      ]);
      setTestResult({
        success: true,
        message: res.trim(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message });
    } finally {
      setTesting(false);
    }
  }

  const cachedCount = Object.keys(cachedTracks).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-fg">
          {m.settings_ai_subtitles_title({}, { locale })}
        </h2>
        <p className="text-xs text-fg-soft mt-1">
          {m.settings_ai_subtitles_description({}, { locale })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 text-xs font-medium bg-surface-strong hover:bg-surface-strong/80 text-fg rounded-lg border border-border transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 bg-surface rounded-xl border border-border p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ai-endpoint" className="text-xs font-medium text-fg-muted">
            {m.settings_ai_endpoint({}, { locale })}
          </label>
          <input
            id="ai-endpoint"
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={m.settings_ai_endpoint_placeholder({}, { locale })}
            className="w-full px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg focus:outline-none focus:border-fg-muted font-mono"
          />
          <span className="text-[11px] text-fg-soft">
            {m.settings_ai_endpoint_description({}, { locale })}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ai-api-key" className="text-xs font-medium text-fg-muted">
              {m.settings_ai_api_key({}, { locale })}
            </label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-fg-muted hover:text-fg transition-colors"
            >
              {showKey ? m.ui_hide({}, { locale }) : m.ui_show({}, { locale })}
            </button>
          </div>
          <input
            id="ai-api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={m.settings_ai_api_key_placeholder({}, { locale })}
            className="w-full px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg focus:outline-none focus:border-fg-muted font-mono"
          />
          <span className="text-[11px] text-fg-soft">
            {m.settings_ai_api_key_description({}, { locale })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-model" className="text-xs font-medium text-fg-muted">
              {m.settings_ai_model({}, { locale })}
            </label>
            <input
              id="ai-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={m.settings_ai_model_placeholder({}, { locale })}
              className="w-full px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg focus:outline-none focus:border-fg-muted font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-target-lang" className="text-xs font-medium text-fg-muted">
              {m.settings_ai_target_language({}, { locale })}
            </label>
            <select
              id="ai-target-lang"
              aria-label={m.settings_ai_target_language({}, { locale })}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg focus:outline-none focus:border-fg-muted"
            >
              {targetLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !endpoint}
            className="px-4 py-2 text-xs font-medium bg-fg text-app hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50"
          >
            {testing
              ? m.ai_subtitles_generating({}, { locale })
              : m.settings_ai_save({}, { locale })}
          </button>

          {cachedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCache();
                setToastMessage(m.ui_clearing());
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="px-3 py-1.5 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
            >
              {m.ui_clear()} ({cachedCount})
            </button>
          )}
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              testResult.success
                ? "bg-surface-strong text-fg border-border"
                : "bg-danger/10 text-danger border-danger/30"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}
