/**
 * 文字のゆれを吸収する小さな関数です。
 * 全角の「ｈｔｔｐ」や「０９０」でも、半角と同じように判定できるようにします。
 */

/** 全角の英数字・記号を半角にします。漢字やかなはそのままです。 */
export function toHalfWidth(input: string): string {
  return input
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

/** 比較用に、空白を畳んで小文字にします。 */
export function normalizeForSearch(input: string): string {
  return toHalfWidth(input).toLowerCase();
}

/** 先頭と末尾の空白を除き、長すぎる入力は切ります。 */
export function clip(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}
