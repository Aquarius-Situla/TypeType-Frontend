import { useState } from "react";
import { Toast } from "../components/toast";
import { callLlmChat } from "../lib/ai-subtitles";
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
    name: "Groq (Fast)",
    endpoint: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct",
  },
  {
    name: "Ollama (Local)",
    endpoint: "http://localhost:11434/v1",
    model: "qwen2.5:7b",
  },
];

const TARGET_LANGS = [
  { value: "zh", label: "简体中文 (Simplified Chinese)" },
  { value: "zh-TW", label: "繁體中文 (Traditional Chinese)" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
  { value: "es", label: "Español" },
];

export function SettingsAiSubtitles() {
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
    setToastMessage(`已应用 ${p.name} 预设`);
    setTimeout(() => setToastMessage(null), 2000);
  }

  async function handleTestConnection() {
    if (!endpoint) {
      setTestResult({ success: false, message: "请填写 API Endpoint 端点地址" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const res = await callLlmChat(endpoint, apiKey, model, [
        {
          role: "user",
          content: 'Translate the word "Hello" into Chinese. Return only the translated word.',
        },
      ]);
      const latency = Date.now() - start;
      setTestResult({
        success: true,
        message: `连接成功 (${latency}ms)! 模型回复: "${res.trim()}"`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message: `连接失败: ${message}` });
    } finally {
      setTesting(false);
    }
  }

  const cachedCount = Object.keys(cachedTracks).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">AI Subtitles (AI 智能字幕)</h2>
        <p className="text-sm text-fg-soft mt-1">
          配置自定义 LLM API 端点，为哔哩哔哩等视频智能生成和翻译高精度双语 AI 字幕。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          快速预设 (Provider Presets)
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-medium bg-surface-strong hover:bg-surface-strong/80 text-fg rounded-lg border border-border-strong transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-surface rounded-xl border border-border-strong p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ai-endpoint" className="text-xs font-medium text-fg-muted">
            API Endpoint (兼容 OpenAI 规范)
          </label>
          <input
            id="ai-endpoint"
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg focus:outline-none focus:ring-1 focus:ring-accent font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ai-api-key" className="text-xs font-medium text-fg-muted">
              API Key (保存在本地浏览器，不经过任何中转)
            </label>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-accent hover:underline"
            >
              {showKey ? "隐藏" : "显示"}
            </button>
          </div>
          <input
            id="ai-api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg focus:outline-none focus:ring-1 focus:ring-accent font-mono"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-model" className="text-xs font-medium text-fg-muted">
              模型名称 (Model)
            </label>
            <input
              id="ai-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-target-lang" className="text-xs font-medium text-fg-muted">
              目标翻译语言 (Target Language)
            </label>
            <select
              id="ai-target-lang"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {TARGET_LANGS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-strong/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !endpoint}
            className="px-4 py-2 text-xs font-medium bg-accent hover:bg-accent-strong text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {testing ? "测试连接中..." : "测试 API 连接"}
          </button>

          {cachedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCache();
                setToastMessage("已清空已缓存的 AI 字幕");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="px-3 py-1.5 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
            >
              清空缓存字幕 ({cachedCount})
            </button>
          )}
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              testResult.success
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
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
