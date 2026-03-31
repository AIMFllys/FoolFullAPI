import api from './client';

export interface UserData {
  username: string;
  apiKey: string | null;
  askCount: number;
  step?: number;
  isBanned: boolean;
}

interface AuthResponse {
  success: true;
  data: { token: string; user: UserData };
}

export async function register(username: string, password: string): Promise<AuthResponse['data']> {
  const res = await api.post<AuthResponse>('/auth/register', { username, password, agreedToTerms: true });
  return res.data.data;
}

export async function login(username: string, password: string): Promise<AuthResponse['data']> {
  const res = await api.post<AuthResponse>('/auth/login', { username, password });
  return res.data.data;
}

export async function getProfile(): Promise<UserData> {
  const res = await api.get<{ success: true; data: UserData }>('/user/profile');
  return res.data.data;
}

export async function getApiKey(): Promise<string> {
  const res = await api.get<{ success: true; data: { apiKey: string } }>('/user/api-key');
  return res.data.data.apiKey;
}

export async function regenerateApiKey(): Promise<string> {
  const res = await api.post<{ success: true; data: { apiKey: string } }>('/user/api-key/regenerate');
  return res.data.data.apiKey;
}
