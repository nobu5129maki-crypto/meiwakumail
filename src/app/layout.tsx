import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "めいわくチェック",
    template: "%s｜めいわくチェック",
  },
  description:
    "届いたメールと電話番号を、この端末の中だけで見分けるアプリです。入力した内容はサーバーに送りません。",
  applicationName: "めいわくチェック",
  appleWebApp: {
    capable: true,
    title: "めいわくチェック",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#10141b" },
  ],
};

/**
 * 保存済みの色を、画面が描かれる前に反映します。
 * 文章は固定で、利用者が入力した内容は入っていません。
 */
const themeScript = `(function(){try{var t=localStorage.getItem("meiwaku-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full antialiased">
        <ServiceWorkerRegister />
        <Suspense fallback={<div className="min-h-full bg-paper" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
