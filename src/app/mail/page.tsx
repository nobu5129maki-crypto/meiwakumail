import type { Metadata } from "next";
import { MailChecker } from "@/components/MailChecker";

export const metadata: Metadata = {
  title: "メールを判定",
  description: "メールの件名、本文、送信元をこの端末の中だけで判定します。",
};

export default function MailPage() {
  return <MailChecker />;
}
