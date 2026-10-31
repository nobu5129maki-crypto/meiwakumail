import type { Metadata } from "next";
import { PhoneChecker } from "@/components/PhoneChecker";

export const metadata: Metadata = {
  title: "電話番号を判定",
  description: "電話番号の形をこの端末の中だけで判定します。",
};

export default function PhonePage() {
  return <PhoneChecker />;
}
