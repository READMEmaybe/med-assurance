import { BrokerPasswordForm } from "@/components/workspace/password-form";
import { requireBroker } from "@/lib/workspace";

export default async function AccountPage() {
  const { profile } = await requireBroker();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MON COMPTE</div>
          <h1>Changer mon mot de passe</h1>
          <p>{profile.full_name} · Sécurité du compte</p>
        </div>
      </div>
      <section className="broker-password-panel">
        <p className="muted">
          Confirmez votre mot de passe actuel, puis choisissez un nouveau mot de
          passe unique d’au moins 12 caractères.
        </p>
        <BrokerPasswordForm />
      </section>
    </>
  );
}
