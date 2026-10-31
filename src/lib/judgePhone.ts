/**
 * 電話番号のルール判定です。
 *
 * ネットで番号を検索しません。入力された数字の形と、
 * 公的窓口として案内されている番号だけを見ます。
 *
 * 警察庁は、特殊詐欺に使われた番号の多くが国際電話番号だと注意しています。
 * ただし「国際電話のすべてが詐欺」ではありません。知っている相手なら、
 * 別の方法で本人確認してください。
 *
 * かかってきたときの番号表示は、本物の警察や会社の番号に見せかけられます。
 * このアプリが「公的な番号と一致」と出しても、自分からかけたときだけ窓口です。
 */

import { findOfficialNumber } from "./officialNumbers";
import { addReason, clampScore, createDraft, levelFromScore, sortReasons } from "./score";
import { toHalfWidth } from "./text";
import type { JudgeResult, PhoneInput } from "./types";

type PhoneKind =
  | "official"
  | "withheld"
  | "international"
  | "premium"
  | "mobile"
  | "landline"
  | "free"
  | "navi"
  | "ip"
  | "iot"
  | "phs"
  | "invalid"
  | "empty";

function headlines(level: JudgeResult["level"], kind: PhoneKind): Pick<JudgeResult, "headline" | "summary"> {
  if (kind === "official") {
    return {
      headline: "正規の可能性が高い",
      summary: "公的な窓口として案内されている番号と一致します。自分からかけるときに使ってください。",
    };
  }
  if (level === "danger") {
    return {
      headline: "危険",
      summary: "詐欺電話でよくある特徴があります。心当たりがなければ出ず、折り返しも控えてください。",
    };
  }
  if (level === "caution") {
    return {
      headline: "注意が必要",
      summary: "この番号だけでは相手が本物とは言えません。大切な話は、自分で調べた公式の番号にかけ直してください。",
    };
  }
  return {
    headline: "正規の可能性が高い",
    summary: "日本の電話番号として、大きく崩れた形ではありません。番号表示は偽装できるので、それだけで信用しないでください。",
  };
}

function phoneAdvice(kind: PhoneKind): string[] {
  const advice: string[] = [];
  if (kind === "official") {
    advice.push("この番号は、自分からかけるときに使ってください。かかってきた表示が同じでも、相手が偽っていることがあります");
  }
  if (kind === "international" || kind === "premium") {
    advice.push("心当たりがなければ出ない。折り返すと、高い国際電話料金になる番号もあります");
  }
  advice.push("相手が教えた番号にはかけ直さない。公式サイトで番号を自分で確かめる");
  advice.push("お金、暗証番号、キャッシュカード、画面の遠隔操作の話が出たら、すぐに切る");
  advice.push("番号の表示は、本物の会社や警察の番号に見せかけられる");
  advice.push("犯罪の被害かもしれないときは警察相談（#9110）。今まさに危険なら110番");
  return advice;
}

function finish(draftReturn: { score: number; reasons: { tone: "good" | "warn" | "bad"; text: string }[] }, kind: PhoneKind): JudgeResult {
  const riskScore = clampScore(draftReturn.score);
  const level = kind === "official" ? "safe" : levelFromScore(riskScore);
  return {
    level,
    riskScore,
    ...headlines(level, kind),
    reasons: sortReasons(draftReturn.reasons),
    advice: phoneAdvice(kind),
  };
}

function repeatedRun(digits: string): number {
  let best = 1;
  let current = 1;
  for (let index = 1; index < digits.length; index += 1) {
    if (digits[index] === digits[index - 1]) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

function sequentialRun(digits: string): number {
  let best = 1;
  let current = 1;
  for (let index = 1; index < digits.length; index += 1) {
    const diff = Number(digits[index]) - Number(digits[index - 1]);
    if (diff === 1 || diff === -1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

function addPatternNotes(digits: string, draft: ReturnType<typeof createDraft>) {
  // 警察庁は、警察署に見せかける末尾「0110」の番号に注意するよう公表しています。
  // 偶然その末尾の普通の番号もあるので、これだけでは「危険」まで上げません。
  if (digits.length >= 10 && digits.endsWith("0110")) {
    addReason(
      draft,
      24,
      "warn",
      "末尾が0110です。警察の110番に見せかける番号として、警察庁が注意しています。警察を名乗る電話は、切って #9110 に相談してください。",
    );
  }

  const repeated = repeatedRun(digits);
  if (repeated >= 6) {
    addReason(draft, 48, "bad", "同じ数字が長く続いています。人が使う番号としては不自然で、仮の番号や迷惑電話で見かける形です。");
  } else {
    const sequential = sequentialRun(digits);
    if (sequential >= 8) {
      addReason(draft, 46, "bad", "数字がほぼ順番に並んでいます（1234…のような並び）。実在の番号としては不自然です。");
    } else if (sequential >= 6) {
      addReason(draft, 22, "warn", "数字の並びが規則的です。メモの書き間違いでないか、番号を見直してください。");
    } else if (/(\d{2})\1{3,}/.test(digits)) {
      addReason(draft, 18, "warn", "2桁の繰り返し（1212…のような並び）があります。不自然な番号のときに見かける形です。");
    }
  }
}

function judgePhoneByRules(input: PhoneInput): JudgeResult {
  const raw = toHalfWidth((input.raw ?? "").trim()).slice(0, 80);
  const draft = createDraft();
  if (!raw) {
    addReason(draft, 20, "warn", "電話番号が空です。番号を入れてから判定してください。");
    return finish(draft, "empty");
  }

  const compact = raw.replace(/[\s().-]/g, "");
  const digits = compact.replace(/\D/g, "");
  const withheld = /非通知|通知不可|通知不可能|番号非通知|プライベート|withheld|unknown|非表示番号/.test(raw);

  if (withheld && digits.length < 6) {
    addReason(
      draft,
      42,
      "warn",
      "非通知、または番号が分からない着信です。警察庁は、非通知の着信を拒否する設定を勧めています。大切な用件なら、相手は番号を知らせてかけ直すか、別の方法で連絡します。",
    );
    return finish(draft, "withheld");
  }
  if (digits.length === 0) {
    addReason(draft, 40, "warn", "数字が見つかりませんでした。電話番号の形になっていません。");
    return finish(draft, "invalid");
  }

  let domestic = digits;
  let japanFromPlus = false;

  // 184 / 186 は「これからかけるとき」に付ける番号で、相手の番号ではありません。
  if (/^18[46]0\d{9,10}$/.test(domestic)) {
    addReason(draft, 12, "warn", "先頭の184や186は、自分の番号を通知する・しないを切り替える番号です。相手から届いた番号ではありません。");
    domestic = domestic.slice(3);
  }

  const hasPlus = compact.includes("+");
  if (hasPlus && domestic.startsWith("81")) {
    domestic = `0${domestic.slice(2)}`;
    japanFromPlus = true;
  } else if (!hasPlus && domestic.startsWith("81") && domestic.length >= 11 && domestic.length <= 13) {
    const asDomestic = `0${domestic.slice(2)}`;
    if (/^0\d{9,10}$/.test(asDomestic)) {
      domestic = asDomestic;
      japanFromPlus = true;
    }
  }

  if (japanFromPlus) {
    addReason(draft, 0, "good", "+81 は日本の国番号です。国内の番号（先頭0）に直して確認しました。");
  }

  const official = findOfficialNumber(domestic);
  if (official) {
    addReason(draft, 4, "good", `この番号は「${official.name}」として案内されています。${official.note}`);
    addReason(
      draft,
      0,
      "warn",
      "かかってきたときの画面表示は、この番号に見せかけられることがあります。自分からこの番号にかけたときだけ、窓口だと考えてください。",
    );
    return finish(draft, "official");
  }

  // 010 や 00 は、日本から海外へかけるときの先頭番号です。着信表示には普通出ません。
  if (domestic.startsWith("010")) {
    const rest = domestic.slice(3);
    if (rest.startsWith("81")) {
      domestic = `0${rest.slice(2)}`;
      addReason(draft, 16, "warn", "先頭の010は、日本から海外へかけるときに付ける番号です。相手から届いた番号としては不自然なので、後ろの国内番号を見ました。");
    } else {
      addReason(
        draft,
        46,
        "warn",
        "日本から海外へかける形の番号です。知らない国際電話は出ず、折り返さないでください。警察庁は、特殊詐欺で国際電話番号が多く使われていると注意しています。すべての国際電話が詐欺というわけではありません。",
      );
      addPatternNotes(domestic, draft);
      return finish(draft, "international");
    }
  }

  if (hasPlus && !japanFromPlus) {
    const premium = /^(800|808|882|883|870)/.test(digits);
    if (premium) {
      addReason(
        draft,
        72,
        "bad",
        "国際フリーフォンや、国際ネットワークの番号（+800、+882 など）の形です。折り返すと高い料金になる手口に使われます。出ず、かけ直さないでください。",
      );
      return finish(draft, "premium");
    }
    addReason(
      draft,
      46,
      "warn",
      "日本以外の国際電話番号です（+81 以外）。警察庁は、特殊詐欺に使われた番号の多くが国際電話番号だと注意しています。すべての国際電話が詐欺ではありません。心当たりがなければ出ず、折り返さないでください。",
    );
    addPatternNotes(digits, draft);
    return finish(draft, "international");
  }

  if (domestic.startsWith("00")) {
    addReason(
      draft,
      46,
      "warn",
      "先頭が00の、国際電話の形です。知らない番号なら出ず、折り返さないでください。",
    );
    addPatternNotes(domestic, draft);
    return finish(draft, "international");
  }

  const wrongMobileLength = /^(070|080|090|050|060|020)/.test(domestic) && domestic.length !== 11;
  const wrongFreeLength = domestic.startsWith("0120") && domestic.length !== 10;
  const wrongNaviLength = domestic.startsWith("0570") && domestic.length !== 10;
  const wrong0800 = domestic.startsWith("0800") && domestic.length !== 11;
  if (wrongMobileLength || wrongFreeLength || wrongNaviLength || wrong0800 || domestic.length < 10 || domestic.length > 11) {
    addReason(
      draft,
      64,
      "bad",
      "日本の電話番号の桁数と合いません。携帯電話は090・080・070で全部11桁、固定電話はだいたい10桁です。書き間違いでないか確認してください。",
    );
    return finish(draft, "invalid");
  }

  let kind: PhoneKind = "landline";
  // 0800 はフリーダイヤルです。080 の携帯電話より先に分けます。
  if (/^0120\d{6}$/.test(domestic) || /^0800\d{7}$/.test(domestic)) {
    kind = "free";
    addReason(
      draft,
      28,
      "warn",
      "フリーダイヤルの形です。企業の本物の番号でも、詐欺でも使われます。公式サイトに載っている番号と、桁まで一致するか自分で確かめてください。",
    );
  } else if (/^(070|080|090)\d{8}$/.test(domestic)) {
    kind = "mobile";
    addReason(draft, 10, "good", "携帯電話の番号（070・080・090）の形です。形が正しいことと、相手が本物であることは別です。");
  } else if (/^050\d{8}$/.test(domestic)) {
    kind = "ip";
    addReason(
      draft,
      32,
      "warn",
      "050はインターネット電話の番号です。会社の代表番号にも使われますが、特殊詐欺でもよく使われます。050だから詐欺、とは限りません。",
    );
  } else if (/^020\d{8}$/.test(domestic)) {
    kind = "iot";
    addReason(draft, 34, "warn", "020は機械や通信機器向けの番号で、人からの電話としてはあまり見かけません。");
  } else if (/^060\d{8}$/.test(domestic)) {
    kind = "phs";
    addReason(draft, 30, "warn", "060は、以前のPHSなどで使われた番号です。今の個人の電話としてはあまり一般的ではありません。");
  } else if (/^0570\d{6}$/.test(domestic)) {
    kind = "navi";
    addReason(draft, 26, "warn", "0570はナビダイヤルです。企業の案内にも使われます。番号が本物かは、公式サイトで確かめてください。");
  } else if (/^0[1-9]\d{8}$/.test(domestic)) {
    kind = "landline";
    addReason(draft, 12, "good", "固定電話の番号の形です。形が正しいことと、相手が本物であることは別です。");
  } else {
    addReason(draft, 64, "bad", "日本で一般的な電話番号の形に当てはまりません。");
    return finish(draft, "invalid");
  }

  addPatternNotes(domestic, draft);
  if (kind === "mobile" || kind === "landline") {
    addReason(
      draft,
      0,
      "warn",
      "番号の見た目が普通でも、相手が別の番号を偽って表示していることがあります。お金や暗証番号の話が出たら切り、公式の番号に自分からかけ直してください。",
    );
  }

  return finish(draft, kind);
}

/**
 * 電話番号判定の入口です。
 * いまはルールだけです。AI や番号検索を足すときも、番号を同意なく外へ送らないでください。
 */
export function judgePhone(input: PhoneInput): JudgeResult {
  return judgePhoneByRules({ raw: input.raw ?? "" });
}
