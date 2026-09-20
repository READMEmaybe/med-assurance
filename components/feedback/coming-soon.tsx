import Link from "next/link";

export function ComingSoon({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-xl py-12">
      <p className="mb-3 text-xs font-medium tracking-widest text-muted uppercase">
        Bientôt disponible
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-4 text-sm leading-7 text-muted">{children}</div>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:bg-background"
      >
        Retour à l’accueil
      </Link>
    </section>
  );
}
