"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="contenu" className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold">
        Cet espace est momentanément indisponible.
      </h1>
      <p role="alert" className="mt-4 text-sm text-muted">
        Veuillez réessayer dans quelques instants.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-md bg-accent px-4 text-sm text-white"
      >
        Réessayer
      </button>
    </main>
  );
}
