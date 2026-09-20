"use client";
import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  if (!available)
    return (
      <p className="notice">
        La connexion au cabinet sera ouverte dès l’activation du service. La
        démonstration est déjà disponible.
      </p>
    );
  return (
    <form action={action} className="form-stack">
      <label>
        Adresse e-mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="vous@cabinet.ma"
        />
      </label>
      <label>
        Mot de passe
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
