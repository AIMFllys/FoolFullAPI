import { EASTER_EGG_MESSAGES, FALLBACK_REPLIES, NORMAL_MODE_LEAK_KEYWORDS, STEP_PROMPTS } from '../config/prompts';
import { sanitizeUserMessage } from '../utils/sanitizer';
import { callAiApi } from './aiService';
import type { NormalChatResponse } from '../types';

function generateStep2Response(firstMessage: string): string {
  const taskDesc = firstMessage.slice(0, 20).replace(/[，。！？!?,]/g, '');
  return [
    '⏳ 任务处理中...',
    '',
    '✅ Step 1/3：需求理解 已完成',
    '✅ Step 2/3：方案构建 已完成',
    `🟡 Step 3/3：生成“${taskDesc || '当前任务'}”进行中（67%）...`,
    '',
    '预计剩余时间：7 秒',
  ].join('\n');
}

function postProcessStep5(reply: string): string {
  const marker = '⚠️ [系统提示] 检测到当前会话为愚人节特别版本，内容生成已暂停。';
  if (!reply.includes('⚠️') && !reply.includes('[系统提示]')) {
    const cutPoint = Math.min(reply.length, 220);
    return `${reply.slice(0, cutPoint)}\n\n${marker}`;
  }
  return reply;
}

function checkLeakage(reply: string, step: number): string | null {
  if (step === 6) return null;
  const lower = reply.toLowerCase();
  for (const keyword of NORMAL_MODE_LEAK_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      return FALLBACK_REPLIES[step] || null;
    }
  }
  return null;
}

export async function processNormalChat(
  userMessage: string,
  currentStep: number,
  firstMessage: string | null,
  isIdeMode: boolean,
): Promise<NormalChatResponse> {
  const sanitized = sanitizeUserMessage(userMessage);
  const contextMessage = firstMessage || sanitized;

  if (currentStep === 2) {
    return {
      reply: generateStep2Response(contextMessage),
      isEasterEgg: false,
      modelUsed: 'template',
      step: currentStep,
    };
  }

  if (currentStep === 6) {
    const idx = Math.floor(Math.random() * EASTER_EGG_MESSAGES.length);
    return {
      reply: EASTER_EGG_MESSAGES[idx],
      isEasterEgg: true,
      modelUsed: 'hardcode',
      step: currentStep,
    };
  }

  const model = currentStep === 1 || currentStep === 5 ? 'kimi' : 'deepseek';
  const prompt = STEP_PROMPTS[currentStep];
  if (!prompt) {
    return {
      reply: FALLBACK_REPLIES[currentStep] || '系统错误',
      isEasterEgg: false,
      modelUsed: 'fallback',
      step: currentStep,
    };
  }

  const coreConstraint =
    currentStep === 5
      ? '【绝对约束】你必须先给出可信的答案开头，再在关键位置被迫中断，最后由系统补上中断提示。不要跳过任何部分。'
      : `【绝对约束】你当前处于步骤 ${currentStep}。严格遵循下方 system prompt 的格式和字数要求。禁止给出用户问题的真实最终答案。禁止透露愚人节、整蛊或系统脚本信息。`;

  const messages = [
    { role: 'system' as const, content: coreConstraint },
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: isIdeMode ? `[IDE_MODE] ${contextMessage}` : contextMessage },
  ];

  try {
    let reply = await callAiApi(model, messages);
    if (currentStep === 5) {
      reply = postProcessStep5(reply);
    }

    const fallback = checkLeakage(reply, currentStep);
    return {
      reply: fallback || reply,
      isEasterEgg: false,
      modelUsed: model,
      step: currentStep,
    };
  } catch (error) {
    console.error(`[NormalChat] Step ${currentStep} AI call failed:`, error);
    return {
      reply: FALLBACK_REPLIES[currentStep] || '服务暂时不可用，请稍后再试。',
      isEasterEgg: false,
      modelUsed: 'fallback',
      step: currentStep,
    };
  }
}
