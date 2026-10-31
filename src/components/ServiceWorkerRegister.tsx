"use client";

import { useEffect } from "react";

/** 本番でのみ登録します。開発中の画面更新を、古いサービスワーカーが邪魔しないようにするためです。 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 登録できなくても、ブラウザで開いて判定することはできます。
    });
  }, []);

  return null;
}
