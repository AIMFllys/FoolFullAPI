import type { SearchSourceItem } from '../types';

export interface MarkerSections {
  think: string;
  plan: string;
  review: string;
  answer: string;
}

const MARKER_ORDER = ['THINK', 'PLAN', 'REVIEW', 'ANSWER'] as const;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function stripModelLeakage(value: string): string {
  return value
    .replace(/愚人节|整蛊|玩笑|恶作剧|prank|april fool/gi, '保密流程')
    .replace(/\s{3,}/g, '  ')
    .trim();
}

export function buildSourceItemsXml(sources: SearchSourceItem[]): { labels: string[]; xml: string } {
  const labels = sources.map((item, index) => {
    const sourceName = item.source || hostnameFromUrl(item.url);
    const title = item.title.trim().replace(/\s+/g, ' ');
    return `${sourceName} · ${title || `来源 ${index + 1}`}`.slice(0, 120);
  });

  const xml = [
    '<source>',
    ...labels.map((label, index) => `  <u${index + 1}>${escapeXml(label)}</u${index + 1}>`),
    '</source>',
  ].join('\n');

  return { labels, xml };
}

export function buildDeepXml(labels: string[], sections: MarkerSections): string {
  return [
    '<source>',
    ...labels.map((label, index) => `  <u${index + 1}>${escapeXml(label)}</u${index + 1}>`),
    '</source>',
    `<think>${escapeXml(sections.think)}</think>`,
    `<plan>${escapeXml(sections.plan)}</plan>`,
    `<review>${escapeXml(sections.review)}</review>`,
    `<answer>${escapeXml(sections.answer)}</answer>`,
  ].join('\n');
}

export function parseMarkerSections(raw: string): MarkerSections | null {
  const think = extractMarkerLoose(raw, 'THINK');
  const plan = extractMarkerLoose(raw, 'PLAN');
  const review = extractMarkerLoose(raw, 'REVIEW');
  const answer = extractMarkerLoose(raw, 'ANSWER');

  if (!think || !plan || !review || !answer) {
    return null;
  }

  return {
    think: stripModelLeakage(think),
    plan: stripModelLeakage(plan),
    review: stripModelLeakage(review),
    answer: sanitizeAnswer(answer),
  };
}

export function coerceMarkerSections(raw: string): MarkerSections {
  const strict = parseMarkerSections(raw);
  if (strict) return strict;

  const think = extractMarkerLoose(raw, 'THINK') || DEFAULT_MARKERS.think;
  const plan = extractMarkerLoose(raw, 'PLAN') || DEFAULT_MARKERS.plan;
  const review = extractMarkerLoose(raw, 'REVIEW') || DEFAULT_MARKERS.review;
  const answer = extractMarkerLoose(raw, 'ANSWER') || extractAnswerFallback(raw) || DEFAULT_MARKERS.answer;

  return {
    think: stripModelLeakage(think),
    plan: stripModelLeakage(plan),
    review: stripModelLeakage(review),
    answer: sanitizeAnswer(answer),
  };
}

export function fallbackMarkerSections(raw: string): MarkerSections {
  return coerceMarkerSections(raw);
}

function extractMarkerLoose(raw: string, tag: (typeof MARKER_ORDER)[number]): string | null {
  const startMarker = `<<${tag}>>`;
  const endMarker = `<</${tag}>>`;
  const startIndex = raw.indexOf(startMarker);
  if (startIndex === -1) return null;

  const contentStart = startIndex + startMarker.length;
  const endIndex = raw.indexOf(endMarker, contentStart);
  if (endIndex !== -1) {
    return raw.slice(contentStart, endIndex).trim() || null;
  }

  const nextMarkers = MARKER_ORDER.slice(MARKER_ORDER.indexOf(tag) + 1)
    .map((nextTag) => raw.indexOf(`<<${nextTag}>>`, contentStart))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  const cutIndex = nextMarkers[0] ?? raw.length;
  return raw.slice(contentStart, cutIndex).trim() || null;
}

function extractAnswerFallback(raw: string): string {
  const withoutThink = raw.replace(/<<THINK>>[\s\S]*?(?=(<<PLAN>>|<<REVIEW>>|<<ANSWER>>|$))/i, '');
  const withoutPlan = withoutThink.replace(/<<PLAN>>[\s\S]*?(?=(<<REVIEW>>|<<ANSWER>>|$))/i, '');
  const withoutReview = withoutPlan.replace(/<<REVIEW>>[\s\S]*?(?=(<<ANSWER>>|$))/i, '');
  return stripMarkerTokens(withoutReview).trim();
}

function sanitizeAnswer(value: string): string {
  return stripMarkerTokens(value).replace(/\n{3,}/g, '\n\n').trim();
}

function stripMarkerTokens(value: string): string {
  return value.replace(/<<\/?[A-Z]+>>/g, '').trim();
}

const DEFAULT_MARKERS: MarkerSections = {
  think: '我先梳理用户问题的核心诉求，并结合搜索来源确认事实边界。',
  plan: '接下来会按照问题背景、可行路径与执行建议组织回答结构，避免遗漏关键条件。',
  review: '我已再次检查资料之间是否存在冲突，优先保留更稳定、更新更近的来源信息。',
  answer: '暂时无法生成完整内容，请稍后再试。',
};

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '未知来源';
  }
}
