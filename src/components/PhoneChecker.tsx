"use client";

import { useState } from "react";
import { addHistory } from "@/lib/history";
import { judgePhone } from "@/lib/judgePhone";
import type { JudgeResult } from "@/lib/types";
import { PageIntro } from "./PageIntro";
import { ResultPanel } from "./ResultPanel";

const EXAMPLES = [
  { label: "普通の形の例", raw: "090-3164-8290" },
  { label: "不自然な並びの例", raw: "090-1234-5678" },
  { label: "非通知の例", raw: "非通知" },
  { label: "国際電話の例", raw: "+44 20 7946 0958" },
  { label: "公的窓口の例", raw: "0120-210-364" },
];

function scrollToResult() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("result")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function PhoneChecker() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);

  function judge(value: string) {
    if (!value.trim()) {
      setError("電話番号を入れてください。非通知のときは「非通知」と入力できます。");
      setResult(null);
      return;
    }
    const next = judgePhone({ raw: value });
    setError("");
    setResult(next);
    addHistory("phone", value, next);
    window.setTimeout(scrollToResult, 30);
  }

  return (
    <div>
      <PageIntro eyebrow="電話" title="かかってきた番号を見分ける">
        <p>ハイフンがあってもなくても大丈夫です。番号はこの端末の中だけで判定し、サーバーには送りません。</p>
      </PageIntro>

      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            className="chip"
            onClick={() => {
              setRaw(example.raw);
              judge(example.raw);
            }}
          >
            {example.label}
          </button>
        ))}
      </div>

      <form
        className="panel space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          judge(raw);
        }}
      >
        <label className="block">
          <span className="mb-1 block font-bold">電話番号</span>
          <span className="mb-2 block text-sm text-muted">例: 090-1234-5678、03-0000-0000、+81 90 1234 5678、非通知</span>
          <input
            className="field"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            inputMode="tel"
            autoComplete="off"
            maxLength={80}
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="submit" className="btn-primary">
            判定する
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setRaw("");
              setResult(null);
              setError("");
            }}
          >
            入力を消す
          </button>
        </div>
      </form>

      {result ? <ResultPanel kindLabel="電話" result={result} /> : null}
    </div>
  );
}
