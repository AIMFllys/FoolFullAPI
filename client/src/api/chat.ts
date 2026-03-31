import api from './client';

export interface ChatResponse {
  reply: string;
  step: number;
  remaining: number;
  isEasterEgg: boolean;
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await api.post<{ success: true; data: ChatResponse }>('/chat', { message });
  return res.data.data;
}
