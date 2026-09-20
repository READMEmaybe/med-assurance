"use client";

import { useActionState } from "react";
import { updateBrokerPassword } from "@/app/actions";

export function BrokerPasswordForm() {
  const [state, action, pending] = useActionState(updateBrokerPassword, {
    error: "",
    success: false,
  });
  return (
    <form action={action} className="form-stack">
      <label>
        Mot de passe actuel
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label>
        Nouveau mot de passe
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <label>
        Confirmer le nouveau mot de passe
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="broker-password-success">
          Votre mot de passe a été modifié.
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Modification en cours…" : "Modifier le mot de passe"}
      </button>
    </form>
  );
}
