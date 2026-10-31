"use client";

/** ライトとダークを切り替え、この端末に覚えさせます。 */
export function ThemeToggle() {
  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("meiwaku-theme", next);
    } catch {
      // 保存できなくても、今の画面の色は切り替わります。
    }
  }

  return (
    <button type="button" className="btn-secondary w-auto min-h-10 px-3 text-sm" onClick={toggle} aria-label="表示の色を切り替える">
      <span className="when-light">ダーク</span>
      <span className="when-dark">ライト</span>
    </button>
  );
}
