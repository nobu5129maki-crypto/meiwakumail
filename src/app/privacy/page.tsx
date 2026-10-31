import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "プライバシー",
  description: "入力したメールや電話番号は、この端末の中だけで処理し、サーバーには送りません。",
};

export default function PrivacyPage() {
  return (
    <div>
      <PageIntro eyebrow="プライバシー" title="入力した内容は、外に送りません">
        <p>めいわくチェックは、判定をあなたのブラウザの中だけで行います。</p>
      </PageIntro>

      <div className="space-y-4">
        <section className="panel p-4">
          <h2 className="text-lg font-extrabold">サーバーには送りません</h2>
          <p className="mt-2 leading-7">
            メールの件名、本文、送信元、ヘッダー、電話番号は、判定のために外部のサーバーへ送信しません。外部のAIサービスにも送りません。インターネット接続は、このアプリの画面を開くとき以外には使いません。
          </p>
        </section>
        <section className="panel p-4">
          <h2 className="text-lg font-extrabold">履歴は、この端末だけ</h2>
          <p className="mt-2 leading-7">
            判定結果は、ブラウザの localStorage に最大30件残します。残すのは結果、危険度、理由と、件名や番号の短い抜粋です。メール本文の全文は保存しません。履歴はこの端末の中だけにあり、作った側も見ることはできません。
          </p>
          <p className="mt-2 leading-7">消すときは「履歴」の「履歴を消す」を押してください。ブラウザのサイトデータを消しても消えます。</p>
        </section>
        <section className="panel p-4">
          <h2 className="text-lg font-extrabold">画面の色の設定</h2>
          <p className="mt-2 leading-7">ライトモードとダークモードの選択も、この端末の localStorage にだけ保存します。</p>
        </section>
        <section className="panel p-4">
          <h2 className="text-lg font-extrabold">表示について</h2>
          <p className="mt-2 leading-7">
            利用者が入力した文章は、プログラムからHTMLとして解釈せず、文字として表示します。判定結果に出たアドレスも、クリックできるリンクにはしません。
          </p>
        </section>
        <section className="panel p-4">
          <h2 className="text-lg font-extrabold">免責</h2>
          <p className="mt-2 leading-7">
            この判定は参考情報です。最終判断はご自身でお願いします。安全寄りと出ても、相手が本物だと保証するものではありません。
          </p>
        </section>
      </div>
    </div>
  );
}
