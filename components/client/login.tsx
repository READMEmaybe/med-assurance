"use client";
import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Brand } from "@/components/layout/brand";
import { clientLogin } from "@/app/client/actions";
import { LanguageSwitch, ResultMessage, useLanguage } from "./language";
export function ClientLogin({
  accessError,
  available,
}: {
  accessError: boolean;
  available: boolean;
}) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(clientLogin, {});
  return (
    <div className="client-login">
      <Image
        className="client-login-background"
        src="/images/coastal-road.webp"
        alt=""
        fill
        sizes="100vw"
        priority
      />
      <header className="client-login-header">
        <Brand />
        <LanguageSwitch />
      </header>
      <main id="contenu" className="client-login-content">
        <div className="client-login-story">
          <span className="client-kicker">
            {t("À VOS CÔTÉS, SIMPLEMENT", "معك، بكل بساطة")}
          </span>
          <h1>
            {t("La route continue.", "الطريق يستمر.")}
            <br />
            {t("Nous sommes là.", "نحن هنا معك.")}
          </h1>
          <p>
            {t(
              "Un imprévu ne devrait jamais se traverser seul. Retrouvez votre cabinet, vos dossiers et la prochaine étape.",
              "لا ينبغي أن تواجه المفاجآت وحدك. تواصل مع وكالتك وتابع ملفاتك والخطوة التالية.",
            )}
          </p>
        </div>
        <section className="client-login-card">
          <span className="client-kicker">
            {t("VOTRE ESPACE CLIENT", "فضاء العميل")}
          </span>
          <h2>{t("Bienvenue chez vous.", "مرحباً بك.")}</h2>
          <p>
            {t("Connectez-vous en toute tranquillité.", "سجّل دخولك بكل راحة.")}
          </p>
          <form action={action} className="client-form">
            <label>
              {t("Adresse e-mail", "البريد الإلكتروني")}
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                dir="ltr"
                placeholder="vous@exemple.ma"
              />
            </label>
            <label>
              {t("Mot de passe", "كلمة المرور")}
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <ResultMessage
              error={state.error || (accessError ? "access" : undefined)}
            />
            {!available && (
              <p role="alert">
                {t(
                  "Le service est momentanément indisponible.",
                  "الخدمة غير متاحة مؤقتاً.",
                )}
              </p>
            )}
            <button
              className="client-button primary"
              disabled={pending || !available}
            >
              {pending
                ? t("Connexion…", "جارٍ الاتصال…")
                : t("Me connecter", "تسجيل الدخول")}
            </button>
          </form>
          <p className="client-login-help">
            {t(
              "Première connexion ou mot de passe oublié ? Contactez votre cabinet pour retrouver votre accès.",
              "أول اتصال أو نسيت كلمة المرور؟ اتصل بوكالتك لاستعادة الوصول.",
            )}
          </p>
          <Link className="client-text-link" href="/login">
            {t("Vous êtes courtier ?", "أنت وسيط تأمين؟")}
          </Link>
        </section>
      </main>
      <footer className="client-login-footer">
        {t(
          "Med Assurance · Votre espace personnel et sécurisé",
          "Med Assurance · فضاؤك الشخصي والآمن",
        )}
      </footer>
    </div>
  );
}
