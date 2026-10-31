/**
 * 判定ロジックの自己チェックです。
 * 実行: npx tsx scripts/self-check.ts
 */
import assert from "node:assert/strict";
import { judgeEmail } from "../src/lib/judgeEmail";
import { judgePhone } from "../src/lib/judgePhone";

const lunch = judgeEmail({
  from: "田中花子 <hanako.tanaka@example.com>",
  subject: "来週のランチ",
  body: "来週の水曜、駅前のカフェでどう？12時で予約しておくね。",
  headers: "",
});
assert.equal(lunch.level, "safe", `lunch score ${lunch.riskScore}`);
assert.ok(lunch.reasons.some((reason) => reason.tone === "good"));

const birthday = judgeEmail({
  from: "太郎 <taro@example.com>",
  subject: "誕生日おめでとう",
  body: "誕生日おめでとうございます。今夜あそぼ。",
  headers: "",
});
assert.equal(birthday.level, "safe", `birthday score ${birthday.riskScore}`);

const phish = judgeEmail({
  from: "Amazonカスタマーサービス <security@amazon-secure-update.com>",
  subject: "【緊急】アカウントが停止されます",
  body: "お客様のアカウントに不正ログインがありました。24時間以内に下記URLから本人確認を行ってください。確認できない場合、アカウントが停止されます。個人情報を更新し、今すぐクリックしてください。\nhttp://amaz0n-support.xyz/login",
  headers: "",
});
assert.equal(phish.level, "danger", `phish score ${phish.riskScore}`);
assert.ok(phish.reasons.some((reason) => reason.text.includes("似せて") || reason.text.includes("フリーメール") || reason.text.includes("公式")));

const gmailBank = judgeEmail({
  from: "三井住友銀行 <support@gmail.com>",
  subject: "アカウントが停止されます",
  body: "本人確認が必要です。今すぐ下記URLからパスワードを入力してください。",
  headers: "",
});
assert.equal(gmailBank.level, "danger", `gmail bank score ${gmailBank.riskScore}`);
assert.ok(gmailBank.reasons.some((reason) => reason.text.includes("フリーメール")));

const realLooking = judgeEmail({
  from: "三井住友カード <notice@smbc-card.com>",
  subject: "ご利用明細",
  body: "今月のご利用明細は、アプリからご確認ください。",
  headers: "",
});
assert.equal(realLooking.level, "safe", `real looking score ${realLooking.riskScore}`);
assert.ok(realLooking.reasons.some((reason) => reason.text.includes("smbc-card.com")));

const replyTo = judgeEmail({
  from: "notice@smbc.co.jp",
  subject: "お知らせ",
  body: "いつもご利用ありがとうございます。",
  headers: "Reply-To: evil@gmail.com",
});
assert.equal(replyTo.level, "caution", `reply-to score ${replyTo.riskScore}`);
assert.ok(replyTo.reasons.some((reason) => reason.text.includes("返信先")));

const zipBomb = judgeEmail({
  from: "経理 <keiri@example.com>",
  subject: "請求書",
  body: "添付のパスワード付きzipを開いてください。パスワードは別送します。",
  headers: "",
});
assert.equal(zipBomb.level, "danger", `zip score ${zipBomb.riskScore}`);

const delivery = judgeEmail({
  from: "宅配便 <info@re-delivery.example>",
  subject: "不在通知",
  body: "再配達はこちら http://tinyurl.com/abc",
  headers: "",
});
assert.notEqual(delivery.level, "safe", `delivery score ${delivery.riskScore}`);

const official = judgePhone({ raw: "0120-210-364" });
assert.equal(official.level, "safe");
assert.ok(official.reasons.some((reason) => reason.text.includes("国際電話不取扱受付センター")));

const police = judgePhone({ raw: "110" });
assert.equal(police.level, "safe");

const sequential = judgePhone({ raw: "090-1234-5678" });
assert.equal(sequential.level, "danger", `sequential score ${sequential.riskScore}`);

const repeated = judgePhone({ raw: "090-1111-1111" });
assert.equal(repeated.level, "danger", `repeated score ${repeated.riskScore}`);

const international = judgePhone({ raw: "+44 20 7946 0958" });
assert.equal(international.level, "caution", `intl score ${international.riskScore}`);

const japanPlus = judgePhone({ raw: "+81 90 3164 8290" });
assert.notEqual(japanPlus.level, "danger", `+81 score ${japanPlus.riskScore} ${japanPlus.headline}`);
assert.ok(japanPlus.reasons.some((reason) => reason.text.includes("日本")));

const withheld = judgePhone({ raw: "非通知" });
assert.equal(withheld.level, "caution");

const ipPhone = judgePhone({ raw: "050-3164-8290" });
assert.equal(ipPhone.level, "caution", `050 score ${ipPhone.riskScore}`);

const fakePoliceEnding = judgePhone({ raw: "090-1234-0110" });
assert.equal(fakePoliceEnding.level, "caution", `0110 score ${fakePoliceEnding.riskScore}`);
assert.ok(fakePoliceEnding.reasons.some((reason) => reason.text.includes("0110")));

const premium = judgePhone({ raw: "+882 1234567" });
assert.equal(premium.level, "danger", `premium score ${premium.riskScore}`);

const garbage = judgePhone({ raw: "abc" });
assert.notEqual(garbage.level, "safe");

const normalMobile = judgePhone({ raw: "090-3164-8290" });
assert.equal(normalMobile.level, "safe", `normal mobile score ${normalMobile.riskScore}`);
assert.ok(normalMobile.reasons.some((reason) => reason.text.includes("偽って")));

const trickLink = judgeEmail({
  from: "notice@example.com",
  subject: "確認",
  body: "ログインはこちら http://amazon.co.jp@evil.example/login",
  headers: "",
});
assert.equal(trickLink.level, "danger", `trick link score ${trickLink.riskScore}`);
assert.ok(trickLink.reasons.some((reason) => reason.text.includes("@")));

const freeDial = judgePhone({ raw: "0800-316-4829" });
assert.equal(freeDial.level, "caution", `0800 score ${freeDial.riskScore} ${freeDial.reasons.map((reason) => reason.text).join(" / ")}`);
assert.ok(freeDial.reasons.some((reason) => reason.text.includes("フリーダイヤル")));

console.log("self-check ok");
