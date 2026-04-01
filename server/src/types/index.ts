import { Request } from 'express';

export type ChatMode = 'deep' | 'normal';
export type ModelType = 'kimi' | 'deepseek';

/** Anonymous session row stored in SQLite */
export interface SessionRow {
  id: string;
  step: number;
  ask_count: number;
  is_ide_mode: number;
  first_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalStatsRow {
  id: number;
  total_asks: number;
  daily_api_count: number;
  last_reset_date: string;
}

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

export interface DeepChatResponse {
  rawXml: string;
  sections: DeepSections;
  modelUsed: string;
  sourceItems: SearchSourceItem[];
}

export interface NormalChatResponse {
  reply: string;
  isEasterEgg: boolean;
  modelUsed: string;
  step: number;
}

/** Express request augmented with a resolved session */
export interface SessionRequest extends Request {
  session?: SessionRow;
}

export interface ChatRequestBody {
  message?: unknown;
  mode?: unknown;
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
