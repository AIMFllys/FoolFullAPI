import { Request } from 'express';

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

/** Express request augmented with a resolved session */
export interface SessionRequest extends Request {
  session?: SessionRow;
}

export interface ChatResponse {
  reply: string;
  step: number;
  remaining: number;
  isEasterEgg: boolean;
}

export type ModelType = 'kimi' | 'deepseek';
