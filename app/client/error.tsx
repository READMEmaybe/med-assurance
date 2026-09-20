"use client";
import { useLanguage } from "@/components/client/language";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main id="contenu" className="client-container client-empty">
      <h1>
        {t(
          "Un instant, nous n’avons pas pu ouvrir votre espace.",
          "تعذر فتح فضائك الآن.",
        )}
      </h1>
      <p>
        {t(
          "Vos dossiers sont conservés. Réessayez dans un instant.",
          "ملفاتك محفوظة. حاول مجدداً بعد قليل.",
        )}
      </p>
      <button className="client-button primary" onClick={reset}>
        {t("Réessayer", "إعادة المحاولة")}
      </button>
    </main>
  );
}
