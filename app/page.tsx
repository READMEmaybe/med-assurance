import Link from "next/link";
import Image from "next/image";
import { Brand } from "@/components/layout/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen welcome-with-photo">
      <Image
        src="/images/coastal-road.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        className="entry-background"
      />
      <header className="border-b border-line bg-surface px-6 py-5 sm:px-10">
        <Brand />
      </header>
      <main
        id="contenu"
        className="welcome-content mx-auto max-w-4xl px-6 py-16 sm:py-24"
      >
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Votre espace assurance
        </p>
        <h1 className="mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Un suivi clair.
          <br />
          Un accompagnement à chaque étape.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          Un imprévu ? Déclarez votre sinistre et suivez votre dossier,
          accompagné par votre cabinet à chaque étape.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="/accueil"
            className="group rounded-lg border border-line bg-surface p-6 transition-colors hover:border-accent"
          >
            <span className="text-xs text-muted">
              Pour les équipes du cabinet
            </span>
            <h2 className="mt-3 text-lg font-semibold">
              Espace courtier{" "}
              <span aria-hidden="true" className="float-right text-muted">
                ↗
              </span>
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Connectez-vous pour retrouver vos dossiers.
            </p>
          </Link>
          <Link
            href="/client"
            className="group rounded-lg border border-line bg-surface p-6 transition-colors hover:border-accent"
          >
            <span className="text-xs text-muted">Pour les assurés</span>
            <h2 className="mt-3 text-lg font-semibold">
              Espace client{" "}
              <span aria-hidden="true" className="float-right text-muted">
                ↗
              </span>
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Un accès dédié au suivi de vos demandes.
            </p>
          </Link>
        </div>
        <Link href="/demo" className="button primary mt-6">
          Explorer la démonstration ↗
        </Link>
        <p className="mt-8 text-xs leading-5 text-muted">
          Découvrez le suivi des sinistres avec cinq situations fictives.
        </p>
      </main>
      <footer className="mx-auto max-w-4xl px-6 pb-8 text-xs text-muted">
        Med Assurance · À vos côtés, simplement.
      </footer>
    </div>
  );
}
