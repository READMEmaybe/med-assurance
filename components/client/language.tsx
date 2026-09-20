"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Language } from "@/lib/client/model";

const Context = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
  t: (fr: string, ar: string) => string;
}>({ language: "fr", setLanguage: () => {}, t: (fr) => fr });
export function ClientLanguage({
  initial,
  children,
}: {
  initial: Language;
  children: ReactNode;
}) {
  const [language, setLanguage] = useState(initial);
  return (
    <Context.Provider
      value={{
        language,
        setLanguage: (value) => {
          setLanguage(value);
          document.cookie = `portal-language=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
        },
        t: (fr, ar) => (language === "ar" ? ar : fr),
      }}
    >
      <div
        className="client-root"
        lang={language}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {children}
      </div>
    </Context.Provider>
  );
}
export const useLanguage = () => useContext(Context);
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switch" aria-label="Langue / اللغة" dir="ltr">
      <button
        type="button"
        aria-pressed={language === "fr"}
        onClick={() => setLanguage("fr")}
      >
        FR
      </button>
      <button
        type="button"
        lang="ar"
        aria-pressed={language === "ar"}
        onClick={() => setLanguage("ar")}
      >
        العربية
      </button>
    </div>
  );
}
export function ResultMessage({
  error,
  success,
}: {
  error?: string;
  success?: boolean;
}) {
  const { t } = useLanguage();
  const messages: Record<string, [string, string]> = {
    credentials: [
      "Vérifiez votre adresse e-mail et votre mot de passe.",
      "تحقق من بريدك الإلكتروني وكلمة المرور.",
    ],
    access: [
      "Cet accès est réservé aux clients. Contactez votre cabinet pour activer votre compte.",
      "هذا الفضاء مخصص للعملاء. اتصل بوكالتك لتفعيل حسابك.",
    ],
    invalid: [
      "Vérifiez les informations saisies.",
      "يرجى التحقق من المعلومات المدخلة.",
    ],
    save: [
      "Enregistrement impossible. Vos informations restent à l’écran. Réessayez.",
      "تعذر الحفظ. معلوماتك لا تزال على الشاشة. حاول مجدداً.",
    ],
    submit: [
      "La déclaration n’a pas pu être confirmée. Réessayez : votre dossier ne sera pas créé en double.",
      "تعذر تأكيد التصريح. حاول مجدداً، لن يتم إنشاء ملف مكرر.",
    ],
    upload: [
      "Le fichier n’a pas pu être enregistré. Réessayez.",
      "تعذر حفظ الملف. حاول مجدداً.",
    ],
    file: [
      "Le document est momentanément indisponible.",
      "المستند غير متاح مؤقتاً.",
    ],
    password: [
      "Utilisez au moins 12 caractères et confirmez le même mot de passe.",
      "استخدم 12 حرفاً على الأقل وأكد كلمة المرور نفسها.",
    ],
    current: [
      "Votre mot de passe actuel est incorrect.",
      "كلمة المرور الحالية غير صحيحة.",
    ],
    passwordSave: [
      "Le mot de passe n’a pas été modifié. Utilisez un nouveau mot de passe plus fort et réessayez.",
      "لم يتم تغيير كلمة المرور. استخدم كلمة مرور جديدة أقوى وحاول مجدداً.",
    ],
    network: [
      "Connexion interrompue. Vérifiez votre réseau et réessayez.",
      "انقطع الاتصال. تحقق من الشبكة وحاول مجدداً.",
    ],
  };
  if (error) {
    const pair = messages[error] ?? messages.network;
    return (
      <p className="client-error" role="alert">
        {t(...pair)}
      </p>
    );
  }
  return success ? (
    <p className="client-success" role="status">
      {t("Modification enregistrée.", "تم حفظ التعديل.")}
    </p>
  ) : null;
}
