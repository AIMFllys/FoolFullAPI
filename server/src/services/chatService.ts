import { STEP_PROMPTS, EASTER_EGG_MESSAGES, FALLBACK_REPLIES } from '../config/prompts';
import { sanitizeUserMessage } from '../utils/sanitizer';
import { callAiApi } from './aiService';

const LEAK_KEYWORDS = ['愚人节', '整蛊', '玩笑', 'prank', 'april fool', '骗你', '恶作剧'];

interface ChatResult {
  reply: string;
  isEasterEgg: boolean;
  modelUsed: string;
}

/** Generate the Step 2 template response (no API call) */
function generateStep2Response(firstMessage: string): string {
  const taskDesc = firstMessage.slice(0, 20).replace(/[？?。！!，,]/g, '');
  return (
    `📊 任务处理中...\n\n` +
    `✅ Step 1/3: 需求理解 — 已完成\n` +
    `✅ Step 2/3: 方案构建 — 已完成\n` +
    `⏳ Step 3/3: 生成「${taskDesc}」— 进行中 (67%)...\n\n` +
    `预计剩余时间：8秒`
  );
}

/** Ensure Step 5 output contains the interruption marker */
function postProcessStep5(reply: string): string {
  const marker = '⚠️ [系统提示] 检测到当前会话为愚人节特别版本，内容生成已暂停。';
  if (!reply.includes('⚠️') && !reply.includes('[系统提示]')) {
    const cutPoint = Math.min(reply.length, 200);
    return reply.slice(0, cutPoint) + '\n\n' + marker;
  }
  return reply;
}

/** Check if AI output leaks prank intent */
function checkLeakage(reply: string, step: number): string | null {
  if (step === 6) return null; // Step 6 is the reveal
  for (const kw of LEAK_KEYWORDS) {
    if (reply.toLowerCase().includes(kw)) {
      return FALLBACK_REPLIES[step] || null;
    }
  }
  return null;
}

export async function processChat(
  userMessage: string,
  currentStep: number,
  firstMessage: string | null,
  isIdeMode: boolean,
): Promise<ChatResult> {
  const sanitized = sanitizeUserMessage(userMessage);
  const contextMessage = firstMessage || sanitized;

  // Step 2: template (no API)
  if (currentStep === 2) {
    return {
      reply: generateStep2Response(contextMessage),
      isEasterEgg: false,
      modelUsed: 'template',
    };
  }

  // Step 6: hardcoded easter egg (no API)
  if (currentStep === 6) {
    const idx = Math.floor(Math.random() * EASTER_EGG_MESSAGES.length);
    return { reply: EASTER_EGG_MESSAGES[idx], isEasterEgg: true, modelUsed: 'hardcode' };
  }

  // Steps 1,5 → Kimi | Steps 3,4 → DeepSeek
  const model = currentStep === 1 || currentStep === 5 ? 'kimi' : 'deepseek';
  const prompt = STEP_PROMPTS[currentStep];
  if (!prompt) {
    return { reply: FALLBACK_REPLIES[currentStep] || '系统错误', isEasterEgg: false, modelUsed: 'fallback' };
  }

  const coreConstraint = `【核心约束】你当前处于步骤 ${currentStep}，必须严格遵循步骤要求。不能回答用户的实际问题，不能透露整蛊意图。`;
  const messages = [
    { role: 'system' as const, content: coreConstraint },
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: isIdeMode ? `[IDE_MODE] ${contextMessage}` : contextMessage },
  ];

  try {
    let reply = await callAiApi(model, messages);

    // Step 5 post-processing
    if (currentStep === 5) {
      reply = postProcessStep5(reply);
    }

    // Leakage check
    const fallback = checkLeakage(reply, currentStep);
    if (fallback) {
      return { reply: fallback, isEasterEgg: false, modelUsed: model };
    }

    return { reply, isEasterEgg: false, modelUsed: model };
  } catch (err) {
    console.error(`[ChatService] Step ${currentStep} AI call failed:`, err);
    return {
      reply: FALLBACK_REPLIES[currentStep] || '服务暂时不可用，请稍后再试。',
      isEasterEgg: false,
      modelUsed: 'fallback',
    };
  }
}
