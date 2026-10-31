"use client";

import { useState } from "react";
import { addHistory } from "@/lib/history";
import { judgeEmail } from "@/lib/judgeEmail";
import type { EmailInput, JudgeResult } from "@/lib/types";
import { PageIntro } from "./PageIntro";
import { ResultPanel } from "./ResultPanel";

type Example = EmailInput & { label: string };

const EXAMPLES: Example[] = [
  {
    label: "危険の例を入れる",
    from: "Amazonカスタマーサービス <security@amazon-secure-update.com>",
    subject: "【緊急】アカウントが停止されます",
    body: "お客様のアカウントに不正ログインがありました。24時間以内に下記URLから本人確認を行ってください。確認できない場合、アカウントが停止されます。個人情報を更新し、今すぐクリックしてください。\nhttp://amaz0n-support.xyz/login",
    headers: "",
  },
  {
    label: "ふつうの例を入れる",
    from: "田中花子 <hanako.tanaka@example.com>",
    subject: "来週のランチ",
    body: "来週の水曜、駅前のカフェでどう？12時で予約しておくね。",
    headers: "",
  },
];

function scrollToResult() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("result")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function MailChecker() {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);

  function judge(input: EmailInput) {
    const hasText = [input.from, input.subject, input.body, input.headers].some((value) => value.trim());
    if (!hasText) {
      setError("件名、本文、送信元のどれかを入れてください。");
      setResult(null);
      return;
    }
    const next = judgeEmail(input);
    setError("");
    setResult(next);
    addHistory("email", input.subject || input.body || input.from, next);
    window.setTimeout(scrollToResult, 30);
  }

  return (
    <div>
      <PageIntro eyebrow="メール" title="届いたメールを見分ける">
        <p>件名、本文、送信元を貼り付けてください。判定はこの端末の中だけで行い、サーバーには送りません。</p>
      </PageIntro>

      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            className="chip"
            onClick={() => {
              setFrom(example.from);
              setSubject(example.subject);
              setBody(example.body);
              setHeaders(example.headers);
              judge(example);
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
          judge({ from, subject, body, headers });
        }}
      >
        <label className="block">
          <span className="mb-1 block font-bold">送信元</span>
          <span className="mb-2 block text-sm text-muted">名前とメールアドレス。例: 楽天市場 &lt;news@example.com&gt;</span>
          <input className="field" value={from} onChange={(event) => setFrom(event.target.value)} autoComplete="off" maxLength={500} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">件名</span>
          <input className="field" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={500} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">本文</span>
          <textarea className="field min-h-40" value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} />
        </label>
        <details className="rounded-xl border border-line p-3">
          <summary className="cursor-pointer font-bold">ヘッダー（任意）</summary>
          <p className="mt-2 text-sm leading-6 text-muted">
            メールアプリの「原文を表示」に出る詳細です。From や Reply-To、spf=fail などが分かると、判定の材料が増えます。分からなければ空で大丈夫です。
          </p>
          <textarea className="field mt-2 min-h-28" value={headers} onChange={(event) => setHeaders(event.target.value)} maxLength={20000} />
        </details>
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
              setFrom("");
              setSubject("");
              setBody("");
              setHeaders("");
              setResult(null);
              setError("");
            }}
          >
            入力を消す
          </button>
        </div>
      </form>

      {result ? <ResultPanel kindLabel="メール" result={result} /> : null}
    </div>
  );
}
