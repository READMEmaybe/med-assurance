import Link from "next/link";

export default function NotFound() {
  return (
    <main id="contenu" className="mx-auto max-w-xl px-6">
      <section className="py-12">
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-4 text-sm text-muted">
          Cette adresse ne correspond à aucun espace.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center text-sm underline"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
