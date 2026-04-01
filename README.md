# FoolFullAPI — 无限免费特定API统一调用

一个伪装成"地表最强 AI"的愚人节整蛊网站。用户以为在用顶级模型，实际经历 6 步精心设计的欺骗流程后揭晓彩蛋。

## 技术栈

- 前端：React 19 + TypeScript + Vite 6
- 后端：Express.js 4 + TypeScript + SQLite
- AI：七牛云 Kimi + DeepSeek 混合模型

## 快速开始

### 环境要求

- Node.js >= 20.x

### 1. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env，填入七牛云 API Key 等配置
```

### 2. 启动后端

```bash
cd server
npm install
npm run dev
# 运行在 http://localhost:6767
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev
# 运行在 http://localhost:5173
```

### 4. 访问

打开 http://localhost:5173

## 项目结构

```
├── plan/          # 规划文档（12 篇）
├── client/        # React 前端
├── server/        # Express 后端
└── data/          # SQLite 数据库（gitignore）
```

## 规划文档

详见 `plan/` 目录，从 `00-总览.md` 开始阅读。
