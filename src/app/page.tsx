import Link from "next/link";
import { HistoryList } from "@/components/HistoryList";

export default function HomePage() {
  return (
    <div>
      <p className="inline-flex rounded-full bg-safe-bg px-3 py-1 text-sm font-bold text-safe">入力内容は端末の外に出ません</p>
      <h1 className="mt-3 text-[1.85rem] font-extrabold leading-snug tracking-tight">メールと電話を、その場で見分ける</h1>
      <p className="mt-3 text-base leading-7 text-muted">
        届いた内容を貼り付けると、怪しい点を日常の言葉で説明します。専門知識は不要です。判定は参考なので、最後はご自身で決めてください。
      </p>

      <div className="mt-6 grid gap-3">
        <Link href="/mail" className="choice">
          <span className="text-sm font-bold text-pine-text">01</span>
          <span className="text-xl font-extrabold">メールを判定</span>
          <span className="text-base leading-7 text-muted">件名、本文、送信元から、急がせる文面や怪しいリンクを探します。</span>
        </Link>
        <Link href="/phone" className="choice">
          <span className="text-sm font-bold text-pine-text">02</span>
          <span className="text-xl font-extrabold">電話番号を判定</span>
          <span className="text-base leading-7 text-muted">日本の番号の形、国際電話、非通知、公的な窓口の番号を見ます。</span>
        </Link>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold">最近の判定</h2>
          <Link href="/history" className="text-sm font-bold text-pine-text underline">
            すべて見る
          </Link>
        </div>
        <HistoryList limit={3} />
      </section>

      <section className="panel mt-8 p-4">
        <h2 className="text-lg font-extrabold">まず覚えておくこと</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
          <li>メールのリンクは開かず、公式アプリか、自分で入力したアドレスから確認する</li>
          <li>電話は切って、自分で調べた公式の番号にかけ直す</li>
          <li>暗証番号や確認コードは、電話でもメールでも教えない</li>
        </ul>
        <p className="mt-3">
          <Link href="/guide" className="font-bold text-pine-text underline">
            よくある手口を見る
          </Link>
        </p>
      </section>
    </div>
  );
}
