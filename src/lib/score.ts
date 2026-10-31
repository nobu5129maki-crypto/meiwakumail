import type { Reason, ReasonTone, RiskLevel } from "./types";

/**
 * 点数の境界です。
 * 25未満: 安全寄り / 正規の可能性が高い
 * 25〜54: 注意
 * 55以上: 危険
 *
 * 言葉を足して点数が変わったら、画面の説明と一緒にここも見直してください。
 */
export const CAUTION_FROM = 25;
export const DANGER_FROM = 55;

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function levelFromScore(score: number): RiskLevel {
  const clamped = clampScore(score);
  if (clamped >= DANGER_FROM) return "danger";
  if (clamped >= CAUTION_FROM) return "caution";
  return "safe";
}

export type Draft = {
  score: number;
  reasons: Reason[];
};

export function createDraft(): Draft {
  return { score: 0, reasons: [] };
}

/**
 * 同じ文の理由は1回だけ追加します。
 * 点数も、初めてその理由を足すときだけ入ります。
 * points が 0 のときは説明だけ足します。
 */
export function addReason(draft: Draft, points: number, tone: ReasonTone, text: string) {
  if (draft.reasons.some((reason) => reason.text === text)) return;
  if (points > 0) draft.score += points;
  draft.reasons.push({ tone, text });
}

const TONE_ORDER: Record<ReasonTone, number> = { bad: 0, warn: 1, good: 2 };

/** 危険な理由を上に、安心材料を下に並べます。 */
export function sortReasons(reasons: Reason[]): Reason[] {
  return [...reasons].sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
}
