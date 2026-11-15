import type { NextConfig } from "next";

/**
 * エックスサーバーは PHP だけなので、画面は静的ファイルとして書き出す。
 * クライアントの遷移は /meiwakumail 配下に固定する。
 * キャッシュコンポーネントは Node サーバーが要るため、この書き出しでは使わない。
 */
const basePath = "/meiwakumail";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
