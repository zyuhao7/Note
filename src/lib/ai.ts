import * as SecureStore from 'expo-secure-store';

// AI 配置存在设备安全存储（Keychain / Keystore），不进数据库。
export interface AiConfig {
  provider: 'deepseek' | 'openai';
  apiKey: string;
  model: string;
}

const KEY = 'ai_config';

// 各家默认接口与模型。两者都兼容 OpenAI Chat Completions 协议。
export const PROVIDERS = {
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
} as const;

export async function loadAiConfig(): Promise<AiConfig | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AiConfig;
  } catch {
    return null;
  }
}

export async function saveAiConfig(cfg: AiConfig): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(cfg));
}

export async function clearAiConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

interface Msg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 调用 Chat Completions，返回回复文本。失败抛出可读错误。
export async function chat(cfg: AiConfig, messages: Msg[]): Promise<string> {
  const base = PROVIDERS[cfg.provider].baseUrl;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`接口返回 ${res.status}：${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('接口没有返回内容');
  return content as string;
}
