import type { Metadata } from "next";
import { HistoryList } from "@/components/HistoryList";
import { PageIntro } from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "判定履歴",
};

export default function HistoryPage() {
  return (
    <div>
      <PageIntro eyebrow="履歴" title="この端末に残っている判定">
        <p>結果と短い抜粋だけを保存しています。メール本文や、入力した全文は残しません。他の端末とは共有されません。</p>
      </PageIntro>
      <HistoryList allowClear />
    </div>
  );
}
