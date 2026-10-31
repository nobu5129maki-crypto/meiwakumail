export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="text-sm font-bold text-pine-text">{eyebrow}</p> : null}
      <h1 className="mt-1 text-[1.7rem] font-extrabold leading-snug tracking-tight">{title}</h1>
      {children ? <div className="mt-3 space-y-2 text-base leading-7 text-muted">{children}</div> : null}
    </header>
  );
}
