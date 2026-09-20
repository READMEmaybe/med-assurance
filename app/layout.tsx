import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Med Assurance", template: "%s · Med Assurance" },
  description: "Votre espace de suivi et d’accompagnement en assurance.",
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a
          href="#contenu"
          className="sr-only z-50 rounded bg-surface p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
