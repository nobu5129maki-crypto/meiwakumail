/**
 * アプリ全体で使う型です。
 * 判定ロジック（lib）と画面（components）の両方から参照します。
 */

/** 3段階の判定。数字の点数から、このいずれかに変換します。 */
export type RiskLevel = "safe" | "caution" | "danger";

/** 理由の色分け。good=安心材料、warn=気になる点、bad=危険のサイン */
export type ReasonTone = "good" | "warn" | "bad";

export type Reason = {
  tone: ReasonTone;
  text: string;
};

/**
 * 判定結果。
 * riskScore は 0 が一番安全寄り、100 が一番危険寄りです。
 */
export type JudgeResult = {
  level: RiskLevel;
  riskScore: number;
  /** 画面に大きく出す言葉（例: 危険） */
  headline: string;
  /** 見出しの下に出す、一文の説明 */
  summary: string;
  reasons: Reason[];
  /** 今すぐ取れる行動 */
  advice: string[];
};

/** メール判定の入力。すべてこの端末の中だけで使います。 */
export type EmailInput = {
  /** 差出人の名前とメールアドレス */
  from: string;
  subject: string;
  body: string;
  /** メールの詳細情報。空でも判定できます。 */
  headers: string;
};

export type PhoneInput = {
  raw: string;
};

export type HistoryKind = "email" | "phone";

/** 履歴に残す内容。本文そのものは保存しません。 */
export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  createdAt: string;
  level: RiskLevel;
  riskScore: number;
  headline: string;
  preview: string;
  reasons: Reason[];
};
