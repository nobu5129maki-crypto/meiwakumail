"use client";

import { useState } from "react";
import { buildCopyText, copyToClipboard } from "@/lib/copyText";
import type { JudgeResult } from "@/lib/types";
import { Disclaimer } from "./Disclaimer";

const METER = {
  safe: "meter-safe",
  caution: "meter-caution",
  danger: "meter-danger",
} as const;

const TONE_MARK = {
  good: "安心材料",
  warn: "気になる点",
  bad: "危険のサイン",
} as const;

/** 判定結果と、なぜそうなったかを表示します。リンクは開きません。 */
export function ResultPanel({ kindLabel, result }: { kindLabel: string; result: JudgeResult }) {
  const [copyState, setCopyState] = useState<{ result: JudgeResult; status: "idle" | "done" | "fail" }>({
    result,
    status: "idle",
  });
  const copyStatus = copyState.result === result ? copyState.status : "idle";

  async function onCopy() {
    const ok = await copyToClipboard(buildCopyText(kindLabel, result));
    setCopyState({ result, status: ok ? "done" : "fail" });
  }

  return (
    <section id="result" aria-live="polite" className="panel mt-6 p-4 sm:p-5">
      <p className="text-sm font-bold text-muted">判定結果</p>
      <h2 className={`mt-1 text-4xl font-extrabold tracking-tight ${result.level === "safe" ? "text-safe" : result.level === "caution" ? "text-caution" : "text-danger"}`}>
        {result.headline}
      </h2>
      <p className="mt-2 text-base leading-7">{result.summary}</p>

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
          <span className="font-bold">危険度 {result.riskScore} / 100</span>
          <span className="text-muted">大きいほど怪しい</span>
        </div>
        <div className="meter" role="img" aria-label={`危険度 ${result.riskScore} / 100`}>
          <span className={METER[result.level]} style={{ width: `${result.riskScore}%` }} />
        </div>
      </div>

      <h3 className="mt-5 text-base font-extrabold">なぜこの判定か</h3>
      <ul className="mt-2 space-y-3">
        {result.reasons.map((reason) => (
          <li key={reason.text} className="rounded-xl bg-paper px-3 py-3">
            <p className={`text-xs font-extrabold ${reason.tone === "good" ? "text-safe" : reason.tone === "warn" ? "text-caution" : "text-danger"}`}>
              {TONE_MARK[reason.tone]}
            </p>
            <p className="mt-1 text-base leading-7">{reason.text}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-base font-extrabold">こうしてください</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-7">
        {result.advice.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-5">
        <button type="button" className="btn-secondary" onClick={onCopy}>
          {copyStatus === "done" ? "コピーしました" : "判定結果をコピー"}
        </button>
        {copyStatus === "fail" ? <p className="mt-2 text-sm text-danger">コピーできませんでした。画面の文章を長押しして選択してください。</p> : null}
      </div>

      <div className="mt-4">
        <Disclaimer />
      </div>
    </section>
  );
}
