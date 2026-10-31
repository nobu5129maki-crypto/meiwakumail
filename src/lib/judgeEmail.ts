/**
 * メールのルール判定です。
 *
 * インターネットには繋ぎません。貼り付けた文章とアドレスの「形」だけを見ます。
 * だから「実在する会社か」は断定できません。
 *
 * 言葉を足したいときは、下の PHRASE_GROUPS の words に追加してください。
 * 同じグループの言葉は、いくつあっても点数は1回だけです。
 *
 * 将来 AI を足すときは、一番下の judgeEmail だけ差し替えます。
 * そのときも、同意なく本文を外部のサーバーへ送らないでください。
 */

import { addReason, clampScore, createDraft, levelFromScore, sortReasons } from "./score";
import { normalizeForSearch, toHalfWidth } from "./text";
import type { EmailInput, JudgeResult, ReasonTone } from "./types";

type PhraseGroup = {
  id: string;
  points: number;
  tone: ReasonTone;
  /** {word} の位置に、見つかった言葉が入ります。 */
  message: string;
  words: string[];
};

const PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: "urgency",
    points: 18,
    tone: "bad",
    message:
      "「{word}」という、急がせる表現があります。詐欺は、冷静に考える時間を与えないように急がせることが多いです。",
    words: [
      "至急",
      "大至急",
      "緊急",
      "今すぐ",
      "直ちに",
      "早急",
      "本日中",
      "24時間以内",
      "48時間以内",
      "期限切れ",
      "まもなく停止",
      "急いで",
      "すぐにご確認",
      "act now",
      "urgent",
      "immediately",
    ],
  },
  {
    id: "account",
    points: 24,
    tone: "bad",
    message:
      "「{word}」という、アカウントを止める・不正があった、という表現があります。本物の連絡でも使いますが、詐欺メールの定番です。",
    words: [
      "アカウントが停止",
      "アカウント停止",
      "利用停止",
      "利用を停止",
      "アカウントが凍結",
      "凍結されました",
      "ロックされました",
      "不正ログイン",
      "不正アクセス",
      "不正利用",
      "セキュリティ上の問題",
      "本人確認が必要",
      "本人確認を",
      "サービスを停止",
      "account suspended",
      "unusual sign-in",
    ],
  },
  {
    id: "personal",
    points: 28,
    tone: "bad",
    message:
      "「{word}」という、パスワードやカード番号などを求める表現があります。メールの案内に従って入力するのは危険です。",
    words: [
      "個人情報を確認",
      "個人情報の確認",
      "情報を更新",
      "パスワードを入力",
      "パスワードを変更",
      "パスワードを教え",
      "パスワードを送",
      "暗証番号",
      "カード番号",
      "セキュリティコード",
      "クレジットカード",
      "マイナンバー",
      "口座番号",
      "確認コードを入力",
      "認証コードを",
      "verify your account",
      "enter your password",
    ],
  },
  {
    id: "money",
    points: 24,
    tone: "bad",
    message: "「{word}」という、お金の移動を求める表現があります。メールの指示で振り込まないでください。",
    words: ["振り込", "振込先", "ビットコイン", "暗号資産", "プリペイド", "ギフトカード", "電子マネー"],
  },
  {
    id: "prize",
    points: 20,
    tone: "bad",
    message: "「{word}」という、もうけ話や未払いをにおわせる表現があります。突然の当選や還付金は疑ってください。",
    words: [
      "当選",
      "還付金",
      "税金が戻",
      "未納",
      "未払い",
      "料金が発生",
      "ポイントが失効",
      "ポイント失効",
      "おめでとうございます",
      "景品",
      "保管料",
    ],
  },
  {
    id: "threat",
    points: 26,
    tone: "bad",
    message:
      "「{word}」という、罪や裁判をにおわせる表現があります。警察や裁判所は、メールだけで逮捕すると伝えたり、見知らぬ口座へ振り込ませたりしません。",
    words: ["逮捕", "訴訟", "訴えます", "差押", "裁判所から", "検察", "刑事事件", "告訴", "資金洗浄", "マネーロンダリング"],
  },
  {
    id: "support",
    points: 24,
    tone: "bad",
    message:
      "「{word}」という、パソコンの画面を操作させる詐欺で使われる表現があります。知らない相手に画面を見せたり、操作されたりしないでください。",
    words: ["遠隔操作", "チームビューワー", "teamviewer", "anydesk", "画面を共有", "ウイルスに感染", "パソコンが感染"],
  },
  {
    id: "delivery",
    points: 16,
    tone: "warn",
    message:
      "「{word}」という、宅配便の不在を装う表現があります。再配達の手続きは、メールのリンクからではなく、宅配会社の公式アプリで行ってください。",
    words: ["不在通知", "再配達", "保管期限", "配達できません", "住所不明", "関税"],
  },
  {
    id: "click",
    points: 12,
    tone: "warn",
    message: "「{word}」という、リンクへ誘導する表現があります。メールに書かれたリンクは開かないでください。",
    words: [
      "クリックしてください",
      "こちらをクリック",
      "下記のリンク",
      "下記url",
      "以下のurl",
      "タップしてください",
      "こちらからログイン",
      "click here",
    ],
  },
];

/** 差出人が「その組織の本人」を装っているときに探す言葉です。 */
const CLAIM_CUES = [
  "カスタマー",
  "サポート",
  "事務局",
  "お客様各位",
  "ご利用の",
  "アカウント",
  "セキュリティ",
  "本人確認",
  "不正",
  "停止",
  "凍結",
  "決済",
  "お支払い",
  "不在",
  "再配達",
  "還付",
  "税務署",
  "年金機構",
  "customer",
  "support",
  "security",
  "account",
];

type Brand = {
  name: string;
  /** 本文や差出人名から探す言葉 */
  words: string[];
  /** ドメインが似ているかを見る、半角の名前 */
  domainTokens: string[];
  /** この組織のメールでよく見るドメイン。サブドメインも一致とみなします。 */
  domains: string[];
  /** .go.jp は個人では取りにくいので、フリーメールとは別の説明にします。 */
  government?: boolean;
};

const BRANDS: Brand[] = [
  { name: "Amazon", words: ["amazon", "アマゾン"], domainTokens: ["amazon"], domains: ["amazon.co.jp", "amazon.com", "amazon.jp"] },
  {
    name: "楽天",
    words: ["楽天", "rakuten"],
    domainTokens: ["rakuten"],
    domains: ["rakuten.co.jp", "rakuten.com", "rakuten-bank.co.jp", "rakuten-sec.co.jp"],
  },
  { name: "Apple", words: ["apple", "アップル", "icloud"], domainTokens: ["apple", "icloud"], domains: ["apple.com", "apple.co.jp"] },
  { name: "Microsoft", words: ["microsoft", "マイクロソフト"], domainTokens: ["microsoft"], domains: ["microsoft.com", "office.com"] },
  { name: "三菱UFJ銀行", words: ["三菱ufj", "三菱ｕｆｊ", "mufg"], domainTokens: ["mufg"], domains: ["mufg.jp"] },
  { name: "三井住友", words: ["三井住友", "smbc"], domainTokens: ["smbc"], domains: ["smbc.co.jp", "smbc-card.com"] },
  { name: "みずほ", words: ["みずほ", "mizuho"], domainTokens: ["mizuho"], domains: ["mizuhobank.co.jp", "mizuho-fg.co.jp"] },
  {
    name: "ゆうちょ・日本郵便",
    words: ["ゆうちょ", "日本郵便", "郵便局"],
    domainTokens: ["japanpost", "yucho"],
    domains: ["japanpost.jp"],
  },
  { name: "ヤマト運輸", words: ["ヤマト", "クロネコ", "yamato"], domainTokens: ["yamato", "kuronekoyamato"], domains: ["kuronekoyamato.co.jp"] },
  { name: "佐川急便", words: ["佐川", "sagawa"], domainTokens: ["sagawa"], domains: ["sagawa-exp.co.jp"] },
  { name: "国税庁", words: ["国税", "税務署", "還付金"], domainTokens: ["nta"], domains: ["nta.go.jp"], government: true },
  { name: "日本年金機構", words: ["年金機構", "日本年金"], domainTokens: ["nenkin"], domains: ["nenkin.go.jp"], government: true },
  { name: "PayPay", words: ["paypay", "ペイペイ"], domainTokens: ["paypay"], domains: ["paypay.ne.jp"] },
  { name: "メルカリ", words: ["メルカリ", "mercari"], domainTokens: ["mercari"], domains: ["mercari.com", "mercari.jp"] },
  { name: "イオン", words: ["イオン", "aeon"], domainTokens: ["aeon"], domains: ["aeon.co.jp", "aeonbank.co.jp"] },
  { name: "セブン銀行", words: ["セブン銀行", "sevenbank"], domainTokens: ["sevenbank"], domains: ["sevenbank.co.jp"] },
];

/** 個人が普通に使うメール。これ自体は危険ではありません。 */
const FREE_MAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.co.jp",
  "yahoo.ne.jp",
  "yahoo.com",
  "ymail.ne.jp",
  "outlook.com",
  "outlook.jp",
  "hotmail.com",
  "hotmail.co.jp",
  "live.com",
  "live.jp",
  "icloud.com",
  "me.com",
  "mac.com",
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "au.com",
  "softbank.ne.jp",
  "i.softbank.jp",
  "vodafone.ne.jp",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "aol.jp",
  "nifty.com",
  "ybb.ne.jp",
];

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "x.gd",
  "is.gd",
  "cutt.ly",
  "ow.ly",
  "goo.gl",
  "buff.ly",
  "rebrand.ly",
  "tiny.cc",
  "rb.gy",
  "bit.do",
  "shorturl.at",
  "v.gd",
  "qr.ae",
]);

/** 個人や詐欺サイトが取りやすく、偽メールで見かける末尾です。 */
const RISKY_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "gq",
  "ml",
  "cf",
  "tk",
  "work",
  "quest",
  "cam",
  "rest",
  "monster",
  "bond",
  "sbs",
  "cfd",
  "icu",
  "country",
  "loan",
  "racing",
]);

const DANGEROUS_EXTENSIONS = [".exe", ".scr", ".js", ".bat", ".cmd", ".hta", ".iso", ".img", ".apk", ".msi", ".vbs", ".jar", ".lnk", ".xlsm", ".docm"];

type ParsedAddress = {
  display: string;
  address: string;
  local: string;
  domain: string;
};

function parseAddress(raw: string): ParsedAddress {
  const match = raw.match(/([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (!match) {
    return { display: raw.trim(), address: "", local: "", domain: "" };
  }
  const local = match[1].toLowerCase();
  const domain = match[2].toLowerCase();
  const display = raw.replace(match[0], "").replace(/[<>"']/g, "").trim();
  return { display, address: `${local}@${domain}`, local, domain };
}

function headerField(headers: string, name: string): string {
  const prefix = `${name.toLowerCase()}:`;
  for (const line of headers.split(/\r?\n/)) {
    if (line.toLowerCase().startsWith(prefix)) return line.slice(prefix.length).trim();
  }
  return "";
}

function isFreeMail(domain: string): boolean {
  return FREE_MAIL_DOMAINS.some((item) => domain === item || domain.endsWith(`.${item}`));
}

function isOfficialDomain(domain: string, officialDomains: string[]): boolean {
  return officialDomains.some((official) => domain === official || domain.endsWith(`.${official}`));
}

/**
 * ドメインの一部が、有名な名前に似ているかを見ます。
 * 「amazon-secure」は似ているとみなします。
 * 「microsoftonline」や「pineapple」のように、ただ文字が続いているだけは誤検知しないようにします。
 */
function labelLooksLike(label: string, token: string): boolean {
  const lower = label.toLowerCase();
  const disguised = token.replace(/o/g, "0").replace(/[il]/g, "1");
  const forms = disguised === token ? [token] : [token, disguised];
  return forms.some((form) => {
    if (form.length < 4) return false;
    if (lower === form) return true;
    if (lower.startsWith(`${form}-`) || lower.endsWith(`-${form}`)) return true;
    return lower.includes(`-${form}-`);
  });
}

function domainLooksLikeBrand(domain: string, tokens: string[]): boolean {
  const labels = domain.split(".");
  return tokens.some((token) => labels.some((label) => labelLooksLike(label, token)));
}

function includesAny(text: string, words: string[]): string | null {
  for (const word of words) {
    if (text.includes(word.toLowerCase())) return word;
  }
  return null;
}

function extractUrls(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'）)\]｝】、。]+/gi)) {
    found.add(match[0].replace(/[.,;:]+$/, ""));
  }
  return [...found];
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function emailAdvice(level: JudgeResult["level"], hasAttachment: boolean): string[] {
  const advice = [
    "メールに書かれたリンクは開かず、公式アプリか、自分でブックマークしたサイトから確認する",
    "パスワード、暗証番号、カード番号、確認コードは、メールの案内では入力しない",
  ];
  if (level === "danger" || hasAttachment) {
    advice.unshift("添付ファイルや、メールの中のボタンは開かない");
  }
  if (level !== "safe") {
    advice.push("メールに書かれた電話番号にはかけない。番号は公式サイトで自分で調べて、かけ直す");
  }
  advice.push("迷ったら、家族か消費者ホットライン（188）に相談する");
  return advice;
}

function headlines(level: JudgeResult["level"]): Pick<JudgeResult, "headline" | "summary"> {
  if (level === "danger") {
    return {
      headline: "危険",
      summary: "詐欺や迷惑メールでよく使われる特徴が、複数見つかりました。リンクも添付も開かないでください。",
    };
  }
  if (level === "caution") {
    return {
      headline: "注意",
      summary: "すぐ偽物と断定はできませんが、気になる点があります。メールのリンクからは開かないでください。",
    };
  }
  return {
    headline: "安全寄り",
    summary: "強い危険のサインは見つかりませんでした。相手が本物だと決まったわけではありません。",
  };
}

function judgeEmailByRules(input: EmailInput): JudgeResult {
  const fromRaw = input.from ?? "";
  const subjectRaw = input.subject ?? "";
  const bodyRaw = input.body ?? "";
  const headersRaw = input.headers ?? "";
  const draft = createDraft();

  if (bodyRaw.length > 20000 || headersRaw.length > 20000) {
    addReason(draft, 0, "warn", "文章がとても長いので、先頭のおよそ2万文字だけを見ました。");
  }

  const subject = normalizeForSearch(subjectRaw.slice(0, 500));
  const body = normalizeForSearch(bodyRaw.slice(0, 20000));
  const headers = toHalfWidth(headersRaw.slice(0, 20000));
  const corpus = `${subject}\n${body}`;

  const fromText = fromRaw.trim() || headerField(headers, "from");
  const sender = parseAddress(toHalfWidth(fromText));
  const reply = parseAddress(toHalfWidth(headerField(headers, "reply-to")));

  let phraseHitCount = 0;
  let deliveryHit = false;
  for (const group of PHRASE_GROUPS) {
    const hit = includesAny(corpus, group.words);
    if (!hit) continue;
    phraseHitCount += 1;
    if (group.id === "delivery") deliveryHit = true;
    addReason(draft, group.points, group.tone, group.message.replace("{word}", hit));
  }

  if (phraseHitCount === 0) {
    addReason(draft, 0, "good", "急がせたり、パスワードや口座番号を求める定番の文面は見当たりませんでした。");
  }

  const claimsToBeOrg = includesAny(corpus, CLAIM_CUES) !== null || phraseHitCount > 0;
  let mentionedOfficialDomain = false;

  for (const brand of BRANDS) {
    const inDisplay = includesAny(normalizeForSearch(sender.display), brand.words);
    const inLocal = includesAny(sender.local, brand.words) || brand.domainTokens.some((token) => sender.local.includes(token));
    const inText = includesAny(corpus, brand.words);
    const brandMentioned = Boolean(inDisplay || inLocal || inText);
    const official = sender.domain ? isOfficialDomain(sender.domain, brand.domains) : false;
    const squats = sender.domain ? domainLooksLikeBrand(sender.domain, brand.domainTokens) && !official : false;
    const pretending = Boolean(inDisplay || inLocal || (inText && claimsToBeOrg) || (squats && (brandMentioned || claimsToBeOrg)));

    if (official && (brandMentioned || squats)) {
      mentionedOfficialDomain = true;
      continue;
    }
    if (!pretending && !(squats && claimsToBeOrg)) continue;

    if (!sender.domain) {
      addReason(
        draft,
        18,
        "warn",
        `「${brand.name}」という名前が出ていますが、送信元のメールアドレスが見つかりません。誰から来たか分からない案内は、リンクを開かないでください。`,
      );
      break;
    }
    if (squats) {
      addReason(
        draft,
        36,
        "bad",
        `送信元のアドレス（${sender.domain}）は、「${brand.name}」の公式ドメインに似せて作った形です。公式サイトは自分で開いてください。`,
      );
      break;
    }
    if (isFreeMail(sender.domain)) {
      addReason(
        draft,
        36,
        "bad",
        `「${brand.name}」を名乗っていますが、送信元はフリーメール（${sender.domain}）です。銀行や通販、公的機関の案内が、個人用のフリーメールから来ることはほぼありません。`,
      );
      break;
    }
    if (brand.government && sender.domain.endsWith(".go.jp")) {
      addReason(
        draft,
        12,
        "warn",
        `「${brand.name}」の話ですが、送信元はこのアプリが把握している窓口ドメインと違います。政府機関のドメインに見えても、リンクは踏まず公式サイトを自分で開いてください。`,
      );
      break;
    }
    addReason(
      draft,
      30,
      "bad",
      `「${brand.name}」の名前が出ていますが、送信元（${sender.domain}）はこのアプリが把握している公式ドメインと違います。偽メールの可能性があります。`,
    );
    break;
  }

  if (mentionedOfficialDomain && sender.domain) {
    addReason(
      draft,
      0,
      "good",
      `送信元のドメイン（${sender.domain}）は、その組織がよく使うものと一致しています。見た目を合わせた偽物もあるので、リンクは公式サイトから開き直してください。`,
    );
  } else if (!sender.domain) {
    addReason(draft, 10, "warn", "送信元のメールアドレスが見つかりません。誰から来たか分からないメールは、リンクを開かないでください。");
  }

  if (sender.domain && reply.domain && sender.domain !== reply.domain) {
    addReason(
      draft,
      26,
      "bad",
      `返信先（${reply.domain}）が、送信元（${sender.domain}）と違います。返事が別の相手に届く形は、なりすましで使われます。`,
    );
  }

  const headerLower = headers.toLowerCase();
  if (/spf=fail|dmarc=fail|dkim=fail/.test(headerLower)) {
    addReason(
      draft,
      28,
      "bad",
      "貼り付けたヘッダーでは、送信元が本物かを確かめる記録が不合格になっていました。なりすましの可能性があります。",
    );
  } else if (/spf=pass|dkim=pass|dmarc=pass/.test(headerLower)) {
    addReason(
      draft,
      0,
      "good",
      "貼り付けたヘッダーでは、送信元チェックが合格になっていました。ヘッダーごと偽物のこともあるので、それだけで安全とは判断しません。",
    );
  }

  const halfWidthBody = toHalfWidth(`${bodyRaw}\n${subjectRaw}`).slice(0, 20000);
  const urls = extractUrls(halfWidthBody);
  let urlFlagged = false;

  if (urls.length >= 3) {
    urlFlagged = true;
    addReason(draft, urls.length >= 6 ? 16 : 8, "warn", `リンクが${urls.length}個あります。リンクが多いメールは、偽サイトへ誘導しやすい形です。`);
  }

  for (const url of urls) {
    let host = "";
    try {
      const parsed = new URL(url);
      host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (parsed.username || parsed.password) {
        urlFlagged = true;
        addReason(
          draft,
          60,
          "bad",
          "リンクの途中に @ があり、見た目の名前と本当の行き先が違います。この形は偽サイトでよく使われます。開かないでください。",
        );
      }
    } catch {
      host = "";
    }
    if (!host) continue;

    if (url.toLowerCase().startsWith("http://")) {
      urlFlagged = true;
      addReason(draft, 14, "warn", "http:// で始まるリンクがあります。鍵のかかっていないアドレスで、偽サイトでも使われます。");
    }
    if (SHORTENERS.has(host)) {
      urlFlagged = true;
      addReason(draft, 22, "bad", `短縮URL（${host}）があります。飛び先が隠れていて、偽サイトに使われやすい形です。`);
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      urlFlagged = true;
      addReason(draft, 30, "bad", "リンク先が、普通の名前ではなく数字の並び（IPアドレス）です。正規の会社ではほとんど見かけません。");
    }
    if (host.includes("xn--") || /[^\x00-\x7f]/.test(host)) {
      urlFlagged = true;
      addReason(draft, 22, "bad", "リンクのアドレスに、見た目をごまかすための特殊な文字が含まれています。");
    }
    const tld = host.split(".").pop() ?? "";
    if (RISKY_TLDS.has(tld)) {
      urlFlagged = true;
      addReason(draft, 16, "warn", `リンク先が「.${tld}」で終わっています。詐欺サイトが取りやすい末尾です。`);
    }
    for (const brand of BRANDS) {
      if (isOfficialDomain(host, brand.domains)) break;
      if (domainLooksLikeBrand(host, brand.domainTokens)) {
        urlFlagged = true;
        addReason(
          draft,
          24,
          "bad",
          `リンク先（${host}）は、「${brand.name}」の公式サイトに似た名前です。アドレスを自分で入力して開き直してください。`,
        );
        break;
      }
    }
  }

  const anchorMismatch = /<a\s[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  for (const match of halfWidthBody.matchAll(anchorMismatch)) {
    const hrefHost = hostnameOf(match[1]);
    const text = match[2].replace(/<[^>]+>/g, "");
    const textUrl = text.match(/https?:\/\/[^\s]+/i);
    const textHost = textUrl ? hostnameOf(textUrl[0]) : "";
    if (hrefHost && textHost && hrefHost !== textHost) {
      urlFlagged = true;
      addReason(draft, 28, "bad", "リンクの見た目のアドレスと、本当の飛び先が違います。典型的なフィッシングの形です。");
      break;
    }
  }

  if (deliveryHit && urls.length > 0) {
    addReason(draft, 14, "warn", "宅配便の案内とリンクがセットになっています。不在通知を装った詐欺でよくある組み合わせです。");
  }
  if (urls.length === 0) {
    addReason(draft, 0, "good", "本文にウェブのアドレス（URL）は見当たりません。リンクがないこと自体が安全の証拠ではありません。");
  } else if (!urlFlagged) {
    addReason(draft, 6, "warn", "リンクがあります。アドレスが普通に見えても、偽サイトのことがあります。メールのリンクからは開かないでください。");
  }

  const attachmentText = halfWidthBody.toLowerCase();
  const dangerousExt = DANGEROUS_EXTENSIONS.find((ext) => attachmentText.includes(ext));
  const mentionsZip = /パスワード付きzip|パスワード付きのzip|パスワードは別送|\.zip|\.rar|\.7z/.test(attachmentText);
  let hasAttachment = false;
  if (/パスワード/.test(attachmentText) && mentionsZip) {
    hasAttachment = true;
    addReason(
      draft,
      58,
      "bad",
      "パスワード付きの圧縮ファイルの案内があります。ウイルス検査をすり抜けるために使われることがあります。開かないでください。",
    );
  } else if (dangerousExt) {
    hasAttachment = true;
    addReason(draft, 58, "bad", `「${dangerousExt}」という、開くと危険になりやすいファイルの種類が出ています。開かないでください。`);
  } else if (mentionsZip) {
    hasAttachment = true;
    addReason(draft, 14, "warn", "圧縮ファイルの話があります。中身が見えにくいので、頼んだ覚えがなければ開かないでください。");
  }
  const attachmentMentions = attachmentText.match(/添付/g);
  if (attachmentMentions && attachmentMentions.length >= 2) {
    hasAttachment = true;
    addReason(draft, 8, "warn", "添付ファイルの話が繰り返されています。身に覚えがなければ開かないでください。");
  }

  const simplified = ["您的", "账号", "帐号", "点击链接", "确认您", "发件", "银行", "立即登录"].filter((word) => corpus.includes(word));
  if (simplified.length > 0) {
    addReason(draft, 20, "warn", "日本のメールではあまり見ない、中国語の書き方が混ざっています。自動翻訳の詐欺メールでよくあります。");
  }

  const spaced = corpus.match(/[ぁ-んァ-ヶ一-龯]\s+[ぁ-んァ-ヶ一-龯]/g);
  if (spaced && spaced.length >= 4) {
    addReason(draft, 14, "warn", "日本語の途中に、不自然な空白が何度もあります。機械翻訳や、検査を避ける書き方で見かける形です。");
  }

  const letters = subjectRaw.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 12 && letters === letters.toUpperCase()) {
    addReason(draft, 8, "warn", "件名が英字の大文字ばかりです。不安をあおる迷惑メールでよくある見た目です。");
  }
  const bangs = (toHalfWidth(subjectRaw + bodyRaw).match(/!/g) ?? []).length;
  if (bangs >= 4) {
    addReason(draft, 6, "warn", "感嘆符（！）がとても多いです。慌てさせようとする文面でよく見ます。");
  }

  const riskScore = clampScore(draft.score);
  const level = levelFromScore(riskScore);
  return {
    level,
    riskScore,
    ...headlines(level),
    reasons: sortReasons(draft.reasons),
    advice: emailAdvice(level, hasAttachment),
  };
}

/**
 * メール判定の入口です。
 * いまはルールだけです。AI を足すときも、本文を同意なく外へ送らないでください。
 */
export function judgeEmail(input: EmailInput): JudgeResult {
  return judgeEmailByRules({
    from: input.from ?? "",
    subject: input.subject ?? "",
    body: input.body ?? "",
    headers: input.headers ?? "",
  });
}
