import { buildDeepReasoningPrompt } from '../config/prompts';
import type { DeepChatResponse, SearchSourceItem } from '../types';
import { buildDeepXml, buildSourceItemsXml, coerceMarkerSections } from '../utils/xml';
import { callQwenCompletion, resolveBestQwenModel, searchWeb, streamQwenCompletion } from './qiniuService';

const THINK_START = '<<THINK>>';
const THINK_END = '<</THINK>>';
const PLAN_START = '<<PLAN>>';
const PLAN_END = '<</PLAN>>';
const REVIEW_START = '<<REVIEW>>';
const REVIEW_END = '<</REVIEW>>';
const ANSWER_START = '<<ANSWER>>';
const ANSWER_END = '<</ANSWER>>';

export interface DeepStreamHandlers {
  onMeta?: (meta: { mode: 'deep'; model: string; searchEnabled: true }) => void;
  onSource?: (payload: { labels: string[]; items: SearchSourceItem[]; xml: string }) => void;
  onThink?: (content: string) => void;
  onPlan?: (content: string) => void;
  onReview?: (content: string) => void;
  onAnswerDelta?: (delta: string) => void;
}

export async function generateDeepChat(userMessage: string): Promise<DeepChatResponse> {
  const sources = await searchWeb(userMessage);
  const { labels } = buildSourceItemsXml(sources);
  const messages = buildDeepMessages(userMessage, sources);
  const { model, content } = await callQwenCompletion(messages);
  const parsed = coerceMarkerSections(content);

  return {
    rawXml: buildDeepXml(labels, parsed),
    sections: {
      source: labels,
      think: parsed.think,
      plan: parsed.plan,
      review: parsed.review,
      answer: parsed.answer,
    },
    modelUsed: model,
    sourceItems: sources,
  };
}

export async function streamDeepChat(
  userMessage: string,
  handlers: DeepStreamHandlers,
): Promise<DeepChatResponse> {
  const resolvedModel = await resolveBestQwenModel();
  handlers.onMeta?.({ mode: 'deep', model: resolvedModel, searchEnabled: true });

  const sources = await searchWeb(userMessage);
  const { labels, xml: sourceXml } = buildSourceItemsXml(sources);
  const messages = buildDeepMessages(userMessage, sources);

  let modelUsed = resolvedModel;
  let rawMarkerOutput = '';
  let emittedThink = false;
  let emittedPlan = false;
  let emittedReview = false;
  let answerOpened = false;
  let answerSentLength = 0;
  let streamedAnswer = '';

  handlers.onSource?.({ labels, items: sources, xml: sourceXml });

  const streamed = await streamQwenCompletion(messages, (delta) => {
    rawMarkerOutput += delta;

    if (!emittedThink) {
      const think = extractSegment(rawMarkerOutput, THINK_START, THINK_END);
      if (think) {
        emittedThink = true;
        handlers.onThink?.(think);
      }
    }

    if (!emittedPlan) {
      const plan = extractSegment(rawMarkerOutput, PLAN_START, PLAN_END);
      if (plan) {
        emittedPlan = true;
        handlers.onPlan?.(plan);
      }
    }

    if (!emittedReview) {
      const review = extractSegment(rawMarkerOutput, REVIEW_START, REVIEW_END);
      if (review) {
        emittedReview = true;
        handlers.onReview?.(review);
      }
    }

    const answerStart = rawMarkerOutput.indexOf(ANSWER_START);
    if (answerStart >= 0) {
      answerOpened = true;
    }

    if (answerOpened) {
      const contentStart = answerStart + ANSWER_START.length;
      const answerEnd = rawMarkerOutput.indexOf(ANSWER_END, contentStart);
      const currentAnswer =
        answerEnd >= 0
          ? rawMarkerOutput.slice(contentStart, answerEnd)
          : rawMarkerOutput.slice(contentStart);
      const deltaText = currentAnswer.slice(answerSentLength);

      if (deltaText) {
        answerSentLength += deltaText.length;
        streamedAnswer += deltaText;
        handlers.onAnswerDelta?.(deltaText);
      }
    }
  });

  modelUsed = streamed.model;

  const parsed = coerceMarkerSections(streamed.content);
  if (streamedAnswer.trim()) {
    parsed.answer = streamedAnswer.trim();
  }

  return {
    rawXml: buildDeepXml(labels, parsed),
    sections: {
      source: labels,
      think: parsed.think,
      plan: parsed.plan,
      review: parsed.review,
      answer: parsed.answer,
    },
    modelUsed,
    sourceItems: sources,
  };
}

function buildDeepMessages(userMessage: string, sources: SearchSourceItem[]) {
  return [
    {
      role: 'system' as const,
      content: '你是可靠的中文研究助理。必须基于资料回答，语气自然、克制、可信。',
    },
    {
      role: 'system' as const,
      content: buildDeepReasoningPrompt(userMessage, sources),
    },
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];
}

function extractSegment(raw: string, startMarker: string, endMarker: string): string | null {
  const startIndex = raw.indexOf(startMarker);
  if (startIndex === -1) return null;
  const contentStart = startIndex + startMarker.length;
  const endIndex = raw.indexOf(endMarker, contentStart);
  if (endIndex === -1) return null;
  return raw.slice(contentStart, endIndex).trim();
}
