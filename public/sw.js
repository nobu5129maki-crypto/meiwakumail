/*
  スマホのホーム画面に追加できるようにするための、最小のサービスワーカーです。
  メールや電話番号は保存しません。ページの取得は、いつもどおり通信に任せます。
*/
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
