import { Request } from 'express';

export interface UserRow {
  id: number;
  username: string;
  password: string;
  api_key: string | null;
  step: number;
  ask_count: number;
  is_banned: number;
  is_ide_mode: number;
  first_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalStatsRow {
  id: number;
  total_users: number;
  total_asks: number;
  daily_api_count: number;
  last_reset_date: string;
}

export interface AuthRequest extends Request {
  user?: { userId: number; username: string };
}

export interface ApiKeyRequest extends Request {
  user?: UserRow;
}

export interface ChatResponse {
  reply: string;
  step: number;
  remaining: number;
  isEasterEgg: boolean;
}

export type ModelType = 'kimi' | 'deepseek';
