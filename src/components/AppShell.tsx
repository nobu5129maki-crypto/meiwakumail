"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Disclaimer } from "./Disclaimer";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/mail", label: "メール" },
  { href: "/phone", label: "電話" },
  { href: "/guide", label: "手口" },
  { href: "/howto", label: "使い方" },
  { href: "/history", label: "履歴" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 no-underline">
            <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl" priority />
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold leading-tight">めいわくチェック</span>
              <span className="block truncate text-xs text-muted">メールと電話を見分ける</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
        <nav className="mx-auto flex w-full max-w-xl flex-wrap gap-2 px-4 pb-3" aria-label="主なメニュー">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "nav-link nav-link-active" : "nav-link"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-xl space-y-3 px-4 py-8">
        <Disclaimer />
        <p className="text-sm">
          <Link href="/privacy" className="font-bold text-pine-text underline">
            プライバシー
          </Link>
          <span className="mx-2 text-muted">/</span>
          <Link href="/howto" className="font-bold text-pine-text underline">
            使い方と相談先
          </Link>
        </p>
      </footer>
    </div>
  );
}
