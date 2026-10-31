import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-[1.7rem] font-extrabold">ページが見つかりません</h1>
      <p className="mt-3 leading-7 text-muted">アドレスが間違っているか、ページが移動した可能性があります。</p>
      <p className="mt-5">
        <Link href="/" className="btn-primary w-auto px-5">
          ホームへ戻る
        </Link>
      </p>
    </div>
  );
}
