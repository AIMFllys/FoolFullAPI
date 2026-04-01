import { env } from '../config/env';
import type { SearchSourceItem } from '../types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatPayload {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  reasoning_effort?: 'low' | 'medium' | 'high';
  enable_search?: boolean;
  search_options?: {
    forced_search: boolean;
    search_strategy: string;
  };
  enable_source?: boolean;
  prepend_search_result?: boolean;
}

interface ModelListResponse {
  data?: Array<{ id?: string }>;
}

interface SearchResponse {
  success?: boolean;
  data?: {
    results?: SearchSourceItem[];
  };
}

let cachedModel: string | null = null;
let cachedModelError: string | null = null;
let resolvingCandidates: Promise<string[]> | null = null;

export async function resolveBestQwenModel(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedModel) return cachedModel;
  const candidates = await resolveQwenCandidates(forceRefresh);
  return candidates[0];
}

export function getModelResolutionStatus(): { model: string | null; error: string | null } {
  return { model: cachedModel, error: cachedModelError };
}

export async function searchWeb(query: string): Promise<SearchSourceItem[]> {
  const response = await fetch(env.qiniuSearchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.qiniuApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      max_results: env.qwenPresearchMaxResults,
      search_type: 'web',
      time_filter: 'year',
    }),
  });

  if (!response.ok) {
    throw new Error(`联网搜索失败：${response.status}`);
  }

  const payload = (await response.json()) as SearchResponse;
  if (!payload.success) {
    throw new Error('联网搜索返回失败状态。');
  }

  return (payload.data?.results || []).slice(0, env.qwenPresearchMaxResults);
}

export async function callQwenCompletion(messages: ChatMessage[]): Promise<{ model: string; content: string }> {
  return withCandidateModels(async (model) => {
    const response = await fetch(env.qiniuApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.qiniuApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildDeepPayload(model, messages, false)),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`模型 ${model} 调用失败：${response.status} ${errorBody}`);
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      model: payload.model || model,
      content: payload.choices?.[0]?.message?.content?.trim() || '',
    };
  });
}

export async function streamQwenCompletion(
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
): Promise<{ model: string; content: string }> {
  return withCandidateModels(async (model) => {
    const response = await fetch(env.qiniuApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.qiniuApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildDeepPayload(model, messages, true)),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.text();
      throw new Error(`模型 ${model} 流式调用失败：${response.status} ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const line = part
          .split('\n')
          .map((row) => row.trim())
          .find((row) => row.startsWith('data:'));

        if (!line) continue;

        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const payload = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = payload.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onDelta(delta);
          }
        } catch {
          // 忽略上游偶发的非标准分片，尽量保持流继续。
        }
      }
    }

    return { model, content: fullContent };
  });
}

async function resolveQwenCandidates(forceRefresh = false): Promise<string[]> {
  if (!forceRefresh && cachedModel) {
    return [cachedModel];
  }
  if (!forceRefresh && resolvingCandidates) {
    return resolvingCandidates;
  }

  const task = (async () => {
    const response = await fetch(env.qiniuModelsUrl, {
      headers: {
        Authorization: `Bearer ${env.qiniuApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`模型列表请求失败：${response.status}`);
    }

    const payload = (await response.json()) as ModelListResponse;
    const availableModels = (payload.data || [])
      .map((item) => item.id?.trim())
      .filter((value): value is string => Boolean(value));

    const preferred = env.qwenModelPreference.filter((model) => availableModels.includes(model));
    const fallback = availableModels.filter((model) => /^qwen/i.test(model) && !preferred.includes(model));
    const candidates = [...preferred, ...fallback];

    if (candidates.length === 0) {
      throw new Error(
        `未在七牛模型列表中找到可用的通义千问模型。当前偏好：${env.qwenModelPreference.join(', ')}；实际返回：${availableModels.join(', ') || '空列表'}`,
      );
    }

    cachedModelError = null;
    return candidates;
  })();

  resolvingCandidates = task;
  try {
    return await task;
  } catch (error) {
    cachedModelError = error instanceof Error ? error.message : '未知错误';
    throw error;
  } finally {
    resolvingCandidates = null;
  }
}

async function withCandidateModels<T>(runner: (model: string) => Promise<T>): Promise<T> {
  const candidates = await resolveQwenCandidates();
  const failures: string[] = [];

  for (const model of candidates) {
    try {
      const result = await runner(model);
      cachedModel = model;
      cachedModelError = null;
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${model}: ${message}`);
    }
  }

  cachedModel = null;
  cachedModelError = failures.join(' | ');
  throw new Error(`所有可选通义模型均调用失败：${failures.join(' | ')}`);
}

function buildDeepPayload(model: string, messages: ChatMessage[], stream: boolean): ChatPayload {
  return {
    model,
    messages,
    stream,
    max_tokens: 1800,
    temperature: 0.2,
    reasoning_effort: 'high',
    enable_search: true,
    enable_source: true,
    prepend_search_result: false,
    search_options: {
      forced_search: true,
      search_strategy: env.qwenSearchStrategy,
    },
  };
}
