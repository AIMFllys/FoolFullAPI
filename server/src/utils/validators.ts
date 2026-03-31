const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

export function validateUsername(username: unknown): string | null {
  if (typeof username !== 'string') return '用户名必须是字符串';
  if (!USERNAME_REGEX.test(username)) return '用户名需 4~20 位，仅支持字母、数字、下划线';
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return '密码必须是字符串';
  if (password.length < 6 || password.length > 32) return '密码长度需 6~32 位';
  return null;
}

export function validateMessage(message: unknown): string | null {
  if (typeof message !== 'string') return '消息必须是字符串';
  const trimmed = message.trim();
  if (trimmed.length === 0) return '消息不能为空';
  if (trimmed.length > 2000) return '消息长度不能超过 2000 字符';
  return null;
}
