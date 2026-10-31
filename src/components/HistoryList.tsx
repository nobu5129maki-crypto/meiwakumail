"use client";

import { useSyncExternalStore } from "react";
import { clearHistory, parseHistorySnapshot, readHistoryServerSnapshot, readHistorySnapshot, subscribeHistory } from "@/lib/history";

const BADGE = {
  safe: "badge badge-safe",
  caution: "badge badge-caution",
  danger: "badge badge-danger",
} as const;

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** この端末に残している判定の一覧です。本文は入っていません。 */
export function HistoryList({ limit, allowClear = false }: { limit?: number; allowClear?: boolean }) {
  const snapshot = useSyncExternalStore(subscribeHistory, readHistorySnapshot, readHistoryServerSnapshot);
  const items = parseHistorySnapshot(snapshot);

  if (items === null) {
    return <p className="text-sm text-muted">履歴を読み込んでいます…</p>;
  }

  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return <p className="text-base leading-7 text-muted">まだ履歴はありません。判定すると、結果の短い抜粋だけがこの端末に残ります。</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map((item) => (
          <li key={item.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={BADGE[item.level]}>{item.headline}</span>
              <span className="text-sm font-bold">{item.kind === "email" ? "メール" : "電話"}</span>
              <span className="text-sm text-muted">{formatWhen(item.createdAt)}</span>
              <span className="text-sm text-muted">危険度 {item.riskScore}</span>
            </div>
            <p className="mt-2 text-base leading-7">{item.preview}</p>
            {item.reasons[0] ? <p className="mt-1 text-sm leading-6 text-muted">{item.reasons[0].text}</p> : null}
          </li>
        ))}
      </ul>
      {allowClear ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const ok = window.confirm("この端末に保存した判定履歴を消します。よろしいですか？");
            if (!ok) return;
            clearHistory();
          }}
        >
          履歴を消す
        </button>
      ) : null}
    </div>
  );
}
