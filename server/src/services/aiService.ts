import axios from 'axios';
import { env } from '../config/env';
import type { ModelType } from '../types';

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MODEL_CONFIG: Record<ModelType, { model: string; maxTokens: number; temperature: number }> = {
  kimi: { model: env.kimiModel, maxTokens: 500, temperature: 0.4 },
  deepseek: { model: env.deepseekModel, maxTokens: 150, temperature: 0.3 },
};

export async function callAiApi(model: ModelType, messages: AiMessage[]): Promise<string> {
  const config = MODEL_CONFIG[model];
  const response = await axios.post(
    env.qiniuApiUrl,
    {
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    },
    {
      headers: {
        Authorization: `Bearer ${env.qiniuApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );
  return response.data?.choices?.[0]?.message?.content?.trim() || '';
}
