import type { JudgeResult } from "./types";

/** 判定結果を、メールやメモに貼れる文章にします。個人の本文は含めません。 */
export function buildCopyText(kindLabel: string, result: JudgeResult): string {
  const lines = [
    `【めいわくチェック】${kindLabel}`,
    `結果: ${result.headline}`,
    `危険度: ${result.riskScore}/100（数字が大きいほど怪しい）`,
    "",
    "理由:",
    ...result.reasons.map((reason) => `・${reason.text}`),
    "",
    "おすすめの行動:",
    ...result.advice.map((item) => `・${item}`),
    "",
    "この判定は参考情報です。最終判断はご自身でお願いします。",
  ];
  return lines.join("\n");
}

/** クリップボードへコピーします。失敗したら画面側で文章を選べるようにします。 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
