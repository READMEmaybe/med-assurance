import Link from "next/link";
import Image from "next/image";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="login-page login-with-photo">
      <Image
        src="/images/coastal-road.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        className="entry-background"
      />
      <Brand />
      <main id="contenu" className="login-panel">
        <span className="eyebrow">ESPACE COURTIER</span>
        <h1>Heureux de vous retrouver.</h1>
        <p className="muted">
          Vos dossiers, vos clients et la prochaine étape.
        </p>
        {error === "access" && (
          <p role="alert" className="form-error">
            Ce compte n’a pas accès à l’espace courtier.
          </p>
        )}
        <LoginForm
          available={Boolean(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          )}
        />
        <div className="login-demo">
          <span>Envie de découvrir l’espace ?</span>
          <Link href="/demo">
            Ouvrir la démonstration <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <Link className="client-entry-link" href="/client/login">
          Vous êtes assuré ? Accéder à l’espace client →
        </Link>
        <Link className="muted text-sm" href="/">
          Retour à l’accueil
        </Link>
      </main>
    </div>
  );
}
