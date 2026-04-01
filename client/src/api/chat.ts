import api, { getSessionId } from './client';

export type ChatMode = 'deep' | 'normal';

export interface SearchSourceItem {
  id: number;
  title: string;
  url: string;
  content: string;
  date?: string;
  source?: string;
}

export interface DeepSections {
  source: string[];
  think: string;
  plan: string;
  review: string;
  answer: string;
}

export interface ChatRequest {
  message: string;
  mode?: ChatMode;
}

export interface ChatResponse {
  reply: string;
  step: number | null;
  remaining: number | null;
  isEasterEgg: boolean;
  mode: ChatMode;
  model?: string | null;
  rawXml?: string;
  sections?: DeepSections;
  sourceItems?: SearchSourceItem[];
}

export type ChatStreamEvent =
  | { event: 'meta'; data: { mode: 'deep'; model: string; searchEnabled: true } }
  | { event: 'phase_info'; data: { phase: number; action: string } }
  | { event: 'source'; data: { labels: string[]; items: SearchSourceItem[] } }
  | { event: 'think'; data: { content: string } }
  | { event: 'plan'; data: { content: string } }
  | { event: 'review'; data: { content: string } }
  | { event: 'answer_delta'; data: { delta: string } }
  | { event: 'interrupt'; data: { phase: number } }
  | { event: 'reveal'; data: { message: string } }
  | {
      event: 'done';
      data: {
        mode: ChatMode;
        model?: string;
        rawXml?: string;
        sections?: DeepSections;
        sourceItems?: SearchSourceItem[];
        isReveal?: boolean;
        interrupted?: boolean;
      };
    }
  | { event: 'error'; data: { code: string; message: string } };

export async function sendMessage(payload: ChatRequest): Promise<ChatResponse> {
  const res = await api.post<{ success: true; data: ChatResponse }>('/chat', payload);
  return res.data.data;
}

export async function streamMessage(
  payload: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(extractErrorMessage(errorText) || '流式请求失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLine = lines.find((line) => line.startsWith('data:'));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.slice(6).trim() as ChatStreamEvent['event'];
      const data = JSON.parse(dataLine.slice(5).trim()) as ChatStreamEvent['data'];
      onEvent({ event, data } as ChatStreamEvent);
    }
  }
}

function extractErrorMessage(text: string): string | null {
  try {
    const payload = JSON.parse(text) as { error?: { message?: string } };
    return payload.error?.message || null;
  } catch {
    return text || null;
  }
}
