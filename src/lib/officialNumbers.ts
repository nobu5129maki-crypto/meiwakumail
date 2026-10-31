/**
 * 自分からかけるときに使う、公的な窓口の番号です。
 * 銀行や通販のサポート番号は変わりやすいので、ここには入れていません。
 *
 * 2026年10月に、次の公開ページで番号を確認しました。
 * - 警察庁 SOS47（#9110、188、0120-924-839、0120-344-999、0120-210-364）
 *   https://www.npa.go.jp/bureau/safetylife/sos47/
 * - 消費者庁 消費者ホットライン（188、予備 03-3446-0999）
 *   https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/hotline/
 * - でんわんセンター（03-6162-1111）
 *   https://www.denwan.jp/aboutus
 *
 * 個別の迷惑電話番号の一覧は持っていません。
 * 番号は別の人に使い回されることがあり、誤って「危険」と出すと迷惑になるためです。
 * 代わりに、国際番号・非通知・末尾0110・不自然な並びなど、形で見ています。
 */

export type OfficialNumber = {
  /** ハイフンなしの数字だけ */
  digits: string;
  name: string;
  note: string;
};

export const OFFICIAL_NUMBERS: OfficialNumber[] = [
  {
    digits: "110",
    name: "警察（緊急）",
    note: "今まさに事件や事故が起きているときの番号です。相談だけなら #9110 です。",
  },
  {
    digits: "119",
    name: "消防・救急",
    note: "火事や救急の番号です。",
  },
  {
    digits: "118",
    name: "海上保安庁",
    note: "海の事件や事故の緊急番号です。",
  },
  {
    digits: "188",
    name: "消費者ホットライン",
    note: "消費者庁が案内している消費生活相談の入口です。近くの相談窓口につながります。",
  },
  {
    digits: "189",
    name: "児童相談所虐待対応ダイヤル",
    note: "虐待の通告や相談の、全国共通の番号です。",
  },
  {
    digits: "9110",
    name: "警察相談専用電話（#9110）",
    note: "緊急ではない警察への相談です。",
  },
  {
    digits: "0120210364",
    name: "国際電話不取扱受付センター",
    note: "固定電話の国際電話を休止する申込み窓口として、警察庁のページで案内されています。",
  },
  {
    digits: "0120924839",
    name: "匿名通報ダイヤル",
    note: "警察庁が案内している通報窓口です。平日の昼間だけの受付です。",
  },
  {
    digits: "0120344999",
    name: "未公開株の通報窓口（日本証券業協会）",
    note: "警察庁のページでも案内されている通報窓口です。",
  },
  {
    digits: "0334460999",
    name: "国民生活センターの予備相談",
    note: "消費者ホットラインがつながらないときの予備です。平日の昼間だけの受付です。",
  },
  {
    digits: "0361621111",
    name: "でんわんセンター（迷惑電話の相談）",
    note: "迷惑電話の相談窓口です。平日の昼間だけの受付です。",
  },
];

export function findOfficialNumber(digits: string): OfficialNumber | undefined {
  return OFFICIAL_NUMBERS.find((item) => item.digits === digits);
}
