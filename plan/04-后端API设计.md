# 04 — 后端 API 路由设计

---

## 路由总览

| 方法 | 路径 | 说明 | 认证 | 限流 |
|------|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 | 10次/分钟/IP |
| POST | `/api/auth/login` | 用户登录 | 否 | 10次/分钟/IP |
| GET | `/api/user/profile` | 获取用户信息 | JWT | 30次/分钟 |
| POST | `/api/chat` | 网页聊天 | JWT | 10次/分钟 |
| POST | `/api/v1/chat` | API 调用 | API Key | 10次/分钟 |
| GET | `/api/user/api-key` | 获取/生成 API Key | JWT | 5次/分钟 |
| POST | `/api/user/api-key/regenerate` | 重新生成 API Key | JWT | 3次/分钟 |
| GET | `/api/health` | 健康检查 | 否 | 无限制 |
| GET | `/api/stats` | 活动统计 | 否 | 10次/分钟 |

---

## 认证路由

### POST `/api/auth/register`

**请求体**：
```json
{
  "username": "string (4~20字符, 字母数字下划线)",
  "password": "string (6~32字符)",
  "agreedToTerms": true
}
```

**处理流程**：
1. 验证输入格式 + `agreedToTerms` 必须为 `true`
2. 检查用户名唯一性
3. bcrypt 哈希密码（salt rounds: 10）
4. 生成 UUID v4 作为 API Key
5. 插入 users 表，更新 global_stats
6. 生成 JWT Token（有效期 24h）

**成功响应**（201）：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "username": "testuser", "apiKey": "550e8400-...", "askCount": 0, "isBanned": false }
  }
}
```

### POST `/api/auth/login`

**请求体**：`{ "username": "string", "password": "string" }`

**成功响应**（200）：同注册，额外包含 `step` 字段。

---

## 聊天路由（核心）

### POST `/api/chat`（网页聊天）

**请求头**：`Authorization: Bearer {JWT_TOKEN}`  
**请求体**：`{ "message": "string (1~2000字符)" }`

**处理流程**：
1. JWT 验证
2. IP 封禁检查
3. 用户封禁检查（ask_count >= 18）
4. 全局日限检查
5. 获取用户当前 step
6. **根据 step 选择处理方式**：

| step | 处理方式 |
|------|---------|
| 1 | 存储 first_message → 调用 Kimi API |
| 2 | 读取 first_message → 模板生成 |
| 3 | 读取 first_message → 调用 DeepSeek API |
| 4 | 读取 first_message → 调用 DeepSeek API |
| 5 | 读取 first_message → 调用 Kimi API |
| 6 | 随机选取彩蛋文案 |

7. 输出验证（关键词过滤、长度检查）
8. 更新 step（+1，>6 重置为 1 并清空 first_message）
9. 更新 ask_count（+1，>=18 标记封禁）
10. 记录 chat_logs
11. 返回回复

**成功响应**（200）：
```json
{
  "success": true,
  "data": {
    "reply": "AI 的回复内容",
    "step": 3,
    "remaining": 15,
    "isEasterEgg": false
  }
}
```

**Step 6 特殊响应**：
```json
{
  "success": true,
  "data": {
    "reply": "哈哈，被骗了吧？...",
    "step": 6,
    "remaining": 12,
    "isEasterEgg": true
  }
}
```

### POST `/api/v1/chat`（API 调用）

**请求头**：`Authorization: Bearer {API_KEY}`  
**请求体**：`{ "message": "string (1~2000字符)" }`

处理流程与网页聊天相同，但：
- 认证方式为 API Key
- 自动启用 IDE 模式（Step 5 的假答案会包含更多代码风格内容）
- 响应包含虚构的 `usage` 字段增加真实感

**成功响应**（200）：
```json
{
  "reply": "AI 的回复内容",
  "step": 3,
  "remaining": 15,
  "model": "claude-opos4-mu4.6",
  "usage": { "prompt_tokens": 150, "completion_tokens": 30, "total_tokens": 180 }
}
```

---

## 中间件设计

### JWT 认证中间件

```typescript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: '请先登录' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token 无效或已过期' } });
  }
};
```

### API Key 认证中间件

```typescript
const apiKeyAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKey);
  if (!user) return res.status(401).json({ error: 'Invalid API Key' });
  req.user = user;
  next();
};
```

### IP 封禁中间件

```typescript
const ipStore = new Map<string, { count: number; resetAt: number; bannedUntil: number | null }>();

const ipBanMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = ipStore.get(ip) || { count: 0, resetAt: now + 5 * 60 * 1000, bannedUntil: null };

  if (record.bannedUntil && now < record.bannedUntil) {
    return res.status(429).json({ success: false, error: { code: 'IP_BANNED', message: '请求过于频繁，请30分钟后再试' } });
  }
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + 5 * 60 * 1000; }
  record.count++;
  if (record.count > 50) {
    record.bannedUntil = now + 30 * 60 * 1000;
    ipStore.set(ip, record);
    return res.status(429).json({ success: false, error: { code: 'IP_BANNED', message: '请求过于频繁，请30分钟后再试' } });
  }
  ipStore.set(ip, record);
  next();
};
```

### 活动结束检查中间件

```typescript
const eventCheckMiddleware = (req, res, next) => {
  if (new Date() >= new Date('2026-04-02T00:00:00+08:00')) {
    return res.status(410).json({ success: false, error: { code: 'EVENT_ENDED', message: '愚人节活动已结束，感谢参与！' } });
  }
  next();
};
```
