import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "使い方と注意",
  description: "めいわくチェックの使い方、限界、困ったときの相談先です。",
};

const STEPS = [
  {
    title: "メールは、中身を貼り付ける",
    body: "送信元、件名、本文を入れます。メールアプリに「原文」や「ヘッダー」があれば、それも足すと返信先の違いなどを見られます。",
  },
  {
    title: "電話は、番号を入れる",
    body: "ハイフンはあってもなくても同じです。非通知なら「非通知」と入力できます。+81 は日本の番号として見ます。",
  },
  {
    title: "理由を読んでから行動する",
    body: "結果の色だけでなく、「なぜ」の箇条書きを読んでください。危険や注意なら、リンクは開かず、相手の番号にはかけません。",
  },
  {
    title: "結果はコピーできる",
    body: "家族に相談するとき、判定結果をコピーして送れます。コピーされるのは判定の説明で、貼り付けた本文そのものではありません。",
  },
];

export default function HowToPage() {
  return (
    <div>
      <PageIntro eyebrow="使い方" title="安全に使うための手順">
        <p>このアプリは、怪しい点の見当をつけるためのものです。相手が本物かどうかの最終決定はできません。</p>
      </PageIntro>

      <ol className="space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="panel p-4">
            <p className="text-sm font-bold text-pine-text">手順 {index + 1}</p>
            <h2 className="text-lg font-extrabold">{step.title}</h2>
            <p className="mt-1 leading-7">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-extrabold">スマホのホーム画面に置く</h2>
        <p className="mt-2 leading-7">ブラウザのメニューから追加すると、アプリのように開けます。判定そのものは、これまでどおりこの端末の中だけで行います。</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
          <li>iPhone: Safari で開き、共有ボタンから「ホーム画面に追加」</li>
          <li>Android: Chrome で開き、メニューから「アプリをインストール」または「ホーム画面に追加」</li>
        </ul>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-extrabold">困ったときの行動</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
          <li>リンクは踏まない。公式アプリか、自分でブックマークしたサイトを開く</li>
          <li>電話は切る。相手が教えた番号にはかけず、公式サイトの番号に自分からかける</li>
          <li>暗証番号、パスワード、確認コード、キャッシュカードは渡さない</li>
          <li>画面共有や遠隔操作のアプリは入れない</li>
          <li>急かされても、その場で決めない。家族に見せてからでよい</li>
        </ul>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-extrabold">相談先</h2>
        <ul className="mt-2 space-y-3 leading-7">
          <li>
            <span className="font-extrabold">110</span>
            <span className="mt-0 block text-muted">今まさに事件や事故が起きているとき</span>
          </li>
          <li>
            <span className="font-extrabold">警察相談 #9110</span>
            <span className="mt-0 block text-muted">緊急ではない警察への相談</span>
          </li>
          <li>
            <span className="font-extrabold">消費者ホットライン 188</span>
            <span className="mt-0 block text-muted">消費生活の相談窓口へ案内してもらえます</span>
          </li>
          <li>
            <span className="font-extrabold">でんわんセンター 03-6162-1111</span>
            <span className="mt-0 block text-muted">迷惑電話の相談。平日の昼間</span>
          </li>
          <li>
            <span className="font-extrabold">国際電話不取扱受付センター 0120-210-364</span>
            <span className="mt-0 block text-muted">固定電話の国際電話を休止する申込み。警察庁のページで案内されています</span>
          </li>
        </ul>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-extrabold">このアプリにできないこと</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 leading-7">
          <li>送信元が実在するか、ネットで調べてはいません</li>
          <li>番号表示の偽装（本物の番号に見せかけること）は、番号だけでは見分けられません</li>
          <li>言葉が新しい手口に変わると、見逃すことがあります</li>
          <li>安全寄りでも、リンクからログインしてよいという意味ではありません</li>
          <li>個別の迷惑電話番号の一覧は持っていません。番号は他の人に使い回されることがあるためです</li>
        </ul>
      </section>
    </div>
  );
}
