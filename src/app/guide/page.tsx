import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "よくある手口",
  description: "フィッシング、架空請求、特殊詐欺など、よくある迷惑メールと詐欺電話の見分け方です。",
};

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-pine-text underline">
      {children}
    </a>
  );
}

const PATTERNS = [
  {
    title: "偽のログイン画面（フィッシング）",
    body: "銀行、通販、宅配、税金の名前で「アカウントが止まります」「今すぐ確認」と書き、リンクを押させます。飛んだ先は本物に似た入力画面です。",
    points: ["送信元がフリーメール、または公式と少し違うアドレス", "急がせる、パスワードやカード番号を求める", "リンクの見た目と、本当の飛び先が違う"],
  },
  {
    title: "宅配便・郵便局の不在通知",
    body: "「荷物を届けられなかった」という短いメールやSMSで、再配達のリンクを押させます。",
    points: ["自分で荷物を頼んだ覚えがない", "短縮URLや、見慣れないアドレス", "手続きは公式アプリから行い、メールのリンクは開かない"],
  },
  {
    title: "還付金・未払い・当選",
    body: "税金が戻る、料金が未払い、懸賞に当選した、と言って個人情報や手数料を求めます。",
    points: ["突然の幸運や、知らない請求は疑う", "メールに書かれた電話番号にはかけない", "税金の話は、国税庁などの公式サイトを自分で開いて確認する"],
  },
  {
    title: "家族や警察を名乗る電話（特殊詐欺）",
    body: "息子や孫、警察官、銀行員のふりをして、お金の移動やキャッシュカードの手渡しを求めます。実在する警察の番号を、画面に偽って表示することもあります。",
    points: ["一度電話を切る。相手が指定した番号にはかけない", "家族には、自分で知っている番号にかけ直す", "警察を名乗る電話は、自分から #9110 に相談する"],
  },
  {
    title: "サポート詐欺",
    body: "「パソコンがウイルスに感染した」と言って、画面共有ソフトを入れさせ、操作されます。",
    points: ["知らない相手に画面を見せない", "遠隔操作のアプリは入れない", "マイクロソフトや通信会社が、突然電話で料金を請求することはありません"],
  },
  {
    title: "国際電話と非通知",
    body: "警察庁は、特殊詐欺に使われた電話番号の多くが、日本以外の国際電話番号だと注意しています。国際電話のすべてが詐欺ではありません。非通知も、病院など正当な用件で使われます。",
    points: ["+81 以外の国際番号は、心当たりがなければ出ない。折り返さない", "非通知は、番号を知らせてかけ直してもらう", "固定電話は、国際電話の着信を休止できる窓口（0120-210-364）がある"],
  },
];

export default function GuidePage() {
  return (
    <div>
      <PageIntro eyebrow="手口" title="よくある迷惑メールと詐欺の形">
        <p>全部を暗記する必要はありません。共通点は「急がせる」「リンクや電話口で秘密の情報を求める」「自分で確認する時間を与えない」です。</p>
      </PageIntro>

      <div className="space-y-4">
        {PATTERNS.map((pattern) => (
          <article key={pattern.title} className="panel p-4">
            <h2 className="text-lg font-extrabold">{pattern.title}</h2>
            <p className="mt-2 leading-7">{pattern.body}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-7">
              {pattern.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="panel mt-4 p-4">
        <h2 className="text-lg font-extrabold">公的な説明</h2>
        <ul className="mt-2 space-y-2 leading-7">
          <li>
            <Out href="https://www.npa.go.jp/bureau/safetylife/sos47/">警察庁・SOS47（特殊詐欺の対策）</Out>
          </li>
          <li>
            <Out href="https://www.npa.go.jp/bureau/safetylife/sos47/case/international-phone/">警察庁・国際電話詐欺への対策（#みんとめ）</Out>
          </li>
          <li>
            <Out href="https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/">消費者庁・消費者ホットライン 188</Out>
          </li>
          <li>
            <Out href="https://www.denwan.jp/aboutus">でんわんセンター（迷惑電話の相談）</Out>
          </li>
        </ul>
      </section>
    </div>
  );
}
