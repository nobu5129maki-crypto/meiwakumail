/**
 * 判定履歴を、この端末の localStorage に保存します。
 * サーバーには送りません。メール本文は保存せず、短い抜粋だけ残します。
 */

import type { HistoryItem, HistoryKind, JudgeResult, Reason, RiskLevel } from "./types";

const STORAGE_KEY = "meiwaku-check-history-v1";
const CHANGE_EVENT = "meiwaku-history-change";
const MAX_ITEMS = 30;

/** サーバー描画のあいだは、まだ端末の保存内容を読まない印です。 */
export const PENDING_HISTORY_SNAPSHOT = "__pending__";

export function readHistoryServerSnapshot(): string {
  return PENDING_HISTORY_SNAPSHOT;
}

function notifyHistoryChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 履歴の変化を購読します。同じタブでの保存と、他タブの storage の両方を見ます。 */
export function subscribeHistory(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** いま端末に入っている履歴の文字列です。中身の比較に使います。 */
export function readHistorySnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function isTone(value: unknown): value is Reason["tone"] {
  return value === "good" || value === "warn" || value === "bad";
}

function isLevel(value: unknown): value is RiskLevel {
  return value === "safe" || value === "caution" || value === "danger";
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HistoryItem>;
  return (
    typeof item.id === "string" &&
    (item.kind === "email" || item.kind === "phone") &&
    typeof item.createdAt === "string" &&
    isLevel(item.level) &&
    typeof item.riskScore === "number" &&
    typeof item.headline === "string" &&
    typeof item.preview === "string" &&
    Array.isArray(item.reasons) &&
    item.reasons.every((reason) => reason && typeof reason.text === "string" && isTone(reason.tone))
  );
}

export function parseHistorySnapshot(raw: string): HistoryItem[] | null {
  if (raw === PENDING_HISTORY_SNAPSHOT) return null;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  return parseHistorySnapshot(readHistorySnapshot()) ?? [];
}

export function makePreview(source: string): string {
  const oneLine = source.replace(/\s+/g, " ").trim();
  if (!oneLine) return "（抜粋なし）";
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine;
}

export function addHistory(kind: HistoryKind, previewSource: string, result: JudgeResult): HistoryItem[] {
  const next: HistoryItem = {
    id: crypto.randomUUID(),
    kind,
    createdAt: new Date().toISOString(),
    level: result.level,
    riskScore: result.riskScore,
    headline: result.headline,
    preview: makePreview(previewSource),
    reasons: result.reasons.slice(0, 8),
  };
  const items = [next, ...loadHistory()].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyHistoryChange();
  } catch {
    // 保存できなくても、画面の判定結果はそのまま出します。
  }
  return items;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyHistoryChange();
  } catch {
    // 消せない環境でも、画面側で空表示にします。
  }
}
