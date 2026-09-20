"use client";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { useActionState, useState } from "react";
import { Brand } from "@/components/layout/brand";
import { Icon } from "@/components/workspace/icon";
import {
  clientLogout,
  updatePassword,
  updateProfile,
  attachDocument,
} from "@/app/client/actions";
import { createClient } from "@/lib/supabase/client";
import type { PortalClaim, PortalData, ActionResult } from "@/lib/client/model";
import { LanguageSwitch, ResultMessage, useLanguage } from "./language";
import { FileUpload } from "./upload";
import dynamic from "next/dynamic";
const Declaration = dynamic(() =>
  import("./declaration").then((module) => module.Declaration),
);

export function useClientStatus() {
  const { t } = useLanguage();
  return (status: string) =>
    ({
      nouveau: t("Déclaration reçue", "تم استلام التصريح"),
      a_traiter: t("En cours d’examen", "قيد المراجعة"),
      en_cours: t("En cours de traitement", "قيد المعالجة"),
      en_attente_client: t("Information requise", "معلومات مطلوبة"),
      intervention_requise: t("En cours de traitement", "قيد المعالجة"),
      clos: t("Dossier terminé", "ملف مكتمل"),
    })[status] ?? t("En cours d’examen", "قيد المراجعة");
}
function useDate() {
  const { language } = useLanguage();
  return (value: string) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Casablanca",
    }).format(new Date(value));
}
const claimHref = (claim: PortalClaim) =>
  `/client/dossiers/${claim.reference}` as Route;
function Missing({ claim }: { claim: PortalClaim }) {
  const { t } = useLanguage();
  const missing = claim.documents.filter((d) =>
    ["manquant", "rejete"].includes(d.status),
  );
  return (
    <p
      className={
        missing.length && claim.status !== "clos"
          ? "client-next"
          : "client-muted"
      }
    >
      {claim.status === "clos"
        ? t("Votre dossier est terminé.", "ملفك مكتمل.")
        : missing.length
          ? t(
              `${missing.length} document${missing.length > 1 ? "s" : ""} à ajouter pour avancer.`,
              `${missing.length} مستندات مطلوبة لمتابعة الملف.`,
            )
          : t(
              "Nous avons vos documents. Le cabinet poursuit le suivi.",
              "استلمنا مستنداتك. تتابع الوكالة ملفك.",
            )}
    </p>
  );
}
function ClaimCard({ claim }: { claim: PortalClaim }) {
  const status = useClientStatus();
  const date = useDate();
  const { t } = useLanguage();
  return (
    <Link className="client-claim-card" href={claimHref(claim)}>
      <div className="client-card-top">
        <span
          className={`client-status ${claim.status === "en_attente_client" ? "waiting" : ""}`}
        >
          {status(claim.status)}
        </span>
        <span className="client-ref" dir="ltr">
          {claim.reference}
        </span>
      </div>
      <h3>{claim.vehicle}</h3>
      <p className="client-muted">
        {claim.city} · {date(claim.occurred_at)}
      </p>
      <Missing claim={claim} />
      <span className="client-card-link">
        {t("Voir mon dossier", "عرض ملفي")} <Icon name="arrow" />
      </span>
    </Link>
  );
}
export function Portal({
  data,
  screen,
  claim,
}: {
  data: PortalData;
  screen: string;
  claim?: PortalClaim;
}) {
  const { t } = useLanguage();
  const nav = [
    ["/client", "home", t("Accueil", "الرئيسية"), "home"],
    ["/client/dossiers", "dossiers", t("Mes dossiers", "ملفاتي"), "claims"],
    ["/client/declarer", "declarer", t("Déclarer", "تصريح"), "file"],
    ["/client/profil", "profil", t("Mon profil", "حسابي"), "profile"],
  ] as const;
  return (
    <div className="client-shell">
      <header className="client-header">
        <Brand href="/client" />
        <div className="client-header-actions">
          <LanguageSwitch />
          <Link
            className="client-avatar"
            href="/client/profil"
            aria-label={t("Mon profil", "حسابي")}
          >
            {data.profile.avatar_url ? (
              <Image
                src={data.profile.avatar_url}
                alt=""
                width={42}
                height={42}
                unoptimized
              />
            ) : (
              data.profile.full_name.charAt(0)
            )}
          </Link>
        </div>
      </header>
      <nav
        className="client-nav"
        aria-label={t("Navigation principale", "التنقل الرئيسي")}
      >
        {nav.map(([href, key, label, icon]) => (
          <Link
            key={key}
            href={href as Route}
            aria-current={screen === key ? "page" : undefined}
          >
            {icon === "profile" ? (
              <span className="client-profile-icon" aria-hidden="true">
                {data.profile.full_name.charAt(0)}
              </span>
            ) : (
              <Icon name={icon} />
            )}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <main id="contenu" className="client-container">
        {screen === "home" && (
          <>
            <section className="client-hero">
              <Image
                src="/images/coastal-road.webp"
                alt=""
                fill
                sizes="(max-width: 800px) 100vw, 1056px"
                priority
              />
              <div>
                <span className="client-kicker">
                  {t("VOTRE ESPACE, EN TOUTE SÉRÉNITÉ", "فضاؤك، بكل راحة")}
                </span>
                <h1>
                  {t("Bonjour", "مرحباً")}{" "}
                  {data.profile.full_name.split(" ")[0]}.
                </h1>
                <p>
                  {t(
                    "Un imprévu ? On avance ensemble, une étape à la fois.",
                    "أمر غير متوقع؟ نتقدم معاً، خطوة بخطوة.",
                  )}
                </p>
              </div>
            </section>
            <div className="client-actions-grid">
              <Link className="client-action-card" href="/client/dossiers">
                <span className="client-action-icon">
                  <Icon name="claims" size={26} />
                </span>
                <h2>{t("Suivre mes dossiers", "تتبع ملفاتي")}</h2>
                <p>
                  {t(
                    "Où en est votre demande ? Retrouvez son avancement et les documents à ajouter.",
                    "أين وصل طلبك؟ اطلع على تقدمه والمستندات المطلوبة.",
                  )}
                </p>
                <span className="client-card-link">
                  {t("Voir mes dossiers", "عرض ملفاتي")} <Icon name="arrow" />
                </span>
              </Link>
              <Link
                className="client-action-card accented"
                href="/client/declarer"
              >
                <span className="client-action-icon">
                  <Icon name="file" size={26} />
                </span>
                <h2>
                  {data.draft
                    ? t("Reprendre ma déclaration", "متابعة تصريحي")
                    : t("Déclarer un sinistre", "التصريح بحادث")}
                </h2>
                <p>
                  {t(
                    "Prenez votre temps. Nous vous guidons avec quelques questions simples.",
                    "خذ وقتك. نرشدك ببعض الأسئلة البسيطة.",
                  )}
                </p>
                <span className="client-card-link">
                  {data.draft
                    ? t("Reprendre là où j’en étais", "المتابعة من حيث توقفت")
                    : t("Commencer ma déclaration", "بدء التصريح")}{" "}
                  <Icon name="arrow" />
                </span>
              </Link>
            </div>
            {data.claims.length > 0 && (
              <section className="client-section">
                <div className="client-section-heading">
                  <h2>{t("Votre dernier dossier", "آخر ملف لك")}</h2>
                  <Link href="/client/dossiers" className="client-text-link">
                    {t("Tout voir", "عرض الكل")}
                  </Link>
                </div>
                <ClaimCard claim={data.claims[0]} />
              </section>
            )}
            <div className="client-reassurance">
              <Icon name="check" />
              <p>
                {t(
                  "Vos informations restent dans votre espace sécurisé. Votre cabinet vous accompagne dans le suivi de votre déclaration.",
                  "تبقى معلوماتك في فضائك الآمن. ترافقك وكالتك في متابعة تصريحك.",
                )}
              </p>
            </div>
          </>
        )}
        {screen === "dossiers" &&
          (claim ? (
            <ClaimDetail claim={claim} data={data} />
          ) : (
            <>
              <PageHeading
                title={t("Mes dossiers", "ملفاتي")}
                description={t(
                  "Votre suivi, simplement. Ouvrez un dossier pour voir la prochaine étape.",
                  "متابعة بسيطة. افتح ملفاً لمعرفة الخطوة التالية.",
                )}
              />
              {data.claims.length ? (
                <div className="client-claims-grid">
                  {data.claims.map((item) => (
                    <ClaimCard key={item.id} claim={item} />
                  ))}
                </div>
              ) : (
                <div className="client-empty">
                  <Icon name="claims" size={40} />
                  <h2>
                    {t(
                      "Aucun dossier pour le moment.",
                      "لا توجد ملفات حالياً.",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Si un imprévu survient, vous pouvez nous le déclarer ici.",
                      "إذا وقع أمر غير متوقع، يمكنك التصريح به هنا.",
                    )}
                  </p>
                  <Link
                    className="client-button primary"
                    href="/client/declarer"
                  >
                    {t("Déclarer un sinistre", "التصريح بحادث")}
                  </Link>
                </div>
              )}
            </>
          ))}
        {screen === "declarer" && <Declaration data={data} />}
        {screen === "profil" && <Profile data={data} />}
      </main>
      <footer className="client-footer">
        {t(
          "Med Assurance · À vos côtés, simplement.",
          "Med Assurance · معك، بكل بساطة.",
        )}
      </footer>
    </div>
  );
}
export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="client-page-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function ClaimDetail({
  claim,
  data,
}: {
  claim: PortalClaim;
  data: PortalData;
}) {
  const { t } = useLanguage();
  const status = useClientStatus();
  const date = useDate();
  const progress =
    claim.status === "clos" ? 3 : claim.status === "nouveau" ? 1 : 2;
  return (
    <>
      <Link className="client-text-link" href="/client/dossiers">
        {t("← Mes dossiers", "ملفاتي ←")}
      </Link>
      <PageHeading
        title={claim.vehicle}
        description={`${claim.reference} · ${claim.city} · ${date(claim.occurred_at)}`}
      />
      <section className="client-panel">
        <span className="client-status">{status(claim.status)}</span>
        <ol className="client-timeline">
          {[
            t("Déclaration reçue", "استلام التصريح"),
            t("Suivi par le cabinet", "متابعة الوكالة"),
            t("Dossier terminé", "اكتمال الملف"),
          ].map((label, i) => (
            <li
              key={i}
              className={i < progress ? "complete" : ""}
              aria-current={i === progress - 1 ? "step" : undefined}
            >
              <span>
                {i < progress ? <Icon name="check" size={16} /> : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <Missing claim={claim} />
        {claim.status === "en_attente_client" && (
          <p>
            {t(
              "Votre cabinet attend un complément. Consultez les documents ci-dessous ou contactez votre interlocuteur.",
              "تنتظر وكالتك معلومات إضافية. راجع المستندات أدناه أو تواصل مع مسؤول ملفك.",
            )}
          </p>
        )}
      </section>
      <section className="client-section">
        <h2>{t("Mes documents", "مستنداتي")}</h2>
        <p className="client-muted">
          {t(
            "Ajoutez ce que vous avez. Vous pourrez revenir plus tard pour compléter.",
            "أضف ما لديك. يمكنك العودة لاحقاً لاستكمال المستندات.",
          )}
        </p>
        <div className="client-documents">
          {claim.documents.map((doc) => (
            <div className="client-panel" key={doc.id}>
              <div className="client-card-top">
                <h3>
                  {doc.type === "constat"
                    ? t("Constat amiable", "المعاينة الودية")
                    : doc.type === "photos"
                      ? t("Photos du véhicule", "صور المركبة")
                      : doc.label}
                </h3>
                <span className="client-doc-status">
                  {
                    {
                      manquant: t("À ajouter", "مطلوب"),
                      recu: t("Reçu", "تم الاستلام"),
                      a_verifier: t("En cours de vérification", "قيد التحقق"),
                      verifie: t("Vérifié", "تم التحقق"),
                      rejete: t("À remplacer", "يجب استبداله"),
                    }[doc.status]
                  }
                </span>
              </div>
              {doc.status === "rejete" && (
                <p className="client-next">
                  {t(
                    "Ajoutez une nouvelle version lisible de ce document.",
                    "أضف نسخة جديدة واضحة من هذا المستند.",
                  )}
                </p>
              )}
              {doc.storage_path && (
                <a
                  className="client-text-link"
                  href={`/api/documents?path=${encodeURIComponent(doc.storage_path)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Ouvrir le document ↗", "فتح المستند ↗")}
                </a>
              )}
              {claim.status !== "clos" && doc.status !== "verifie" && (
                <FileUpload
                  userId={data.profile.id}
                  folder={claim.id}
                  label={t(
                    "Ajouter ou remplacer le fichier",
                    "إضافة الملف أو استبداله",
                  )}
                  done={Boolean(doc.storage_path)}
                  onUploaded={async (path) => {
                    const result = await attachDocument(claim.id, doc.id, path);
                    if (result.error) throw new Error(result.error);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="client-panel client-statement">
        <h2>{t("Votre déclaration", "تصريحك")}</h2>
        <dl>
          <div>
            <dt>{t("Date de l’accident", "تاريخ الحادث")}</dt>
            <dd>{date(claim.occurred_at)}</dd>
          </div>
          <div>
            <dt>{t("Lieu", "المكان")}</dt>
            <dd>
              {claim.city} · {claim.location}
            </dd>
          </div>
          <div>
            <dt>{t("Véhicule", "المركبة")}</dt>
            <dd>
              {claim.vehicle} · <bdi>{claim.registration}</bdi>
            </dd>
          </div>
        </dl>
        <p
          lang={claim.statement_language}
          dir={claim.statement_language === "ar" ? "rtl" : "ltr"}
        >
          {claim.statement}
        </p>
      </section>
    </>
  );
}
function Profile({ data }: { data: PortalData }) {
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState(data.profile.avatar_path ?? "");
  const [preview, setPreview] = useState(data.profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [profileState, profileAction, profilePending] = useActionState(
    async (state: ActionResult, form: FormData) => {
      try {
        return await updateProfile(state, form);
      } catch {
        return { error: "network" };
      }
    },
    {},
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    async (state: ActionResult, form: FormData) => {
      try {
        return await updatePassword(state, form);
      } catch {
        return { error: "network" };
      }
    },
    {},
  );
  return (
    <>
      <PageHeading
        title={t("Mon profil", "حسابي")}
        description={t(
          "Vos informations personnelles, à jour et en sécurité.",
          "معلوماتك الشخصية، محدثة وآمنة.",
        )}
      />
      <div className="client-profile-grid">
        <section className="client-panel">
          <h2>{t("Mes informations", "معلوماتي")}</h2>
          <div className="client-profile-photo">
            {preview ? (
              <Image
                src={preview}
                alt={t("Votre photo de profil", "صورة حسابك")}
                width={88}
                height={88}
                unoptimized
              />
            ) : (
              <span>{data.profile.full_name.charAt(0)}</span>
            )}
          </div>
          <FileUpload
            avatar
            label={t("Photo de profil", "صورة الحساب")}
            userId={data.profile.id}
            folder="profile"
            onBusy={setUploading}
            onUploaded={async (path) => {
              const { data: signed, error } = await createClient()
                .storage.from("avatars")
                .createSignedUrl(path, 3600);
              if (error) throw error;
              setAvatar(path);
              setPreview(signed.signedUrl);
            }}
          />
          <form action={profileAction} className="client-form">
            <input type="hidden" name="avatar" value={avatar} />
            <label>
              {t("Nom complet", "الاسم الكامل")}
              <input
                name="name"
                defaultValue={data.profile.full_name}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
            <label>
              {t("Adresse e-mail", "البريد الإلكتروني")}
              <input
                type="email"
                value={data.profile.email ?? ""}
                readOnly
                dir="ltr"
              />
            </label>
            <ResultMessage {...profileState} />
            <button
              className="client-button primary"
              disabled={profilePending || uploading}
            >
              {profilePending
                ? t("Enregistrement…", "جارٍ الحفظ…")
                : t("Enregistrer mes informations", "حفظ معلوماتي")}
            </button>
          </form>
        </section>
        <section className="client-panel">
          <h2>{t("Changer mon mot de passe", "تغيير كلمة المرور")}</h2>
          <p className="client-muted">
            {t(
              "Choisissez un mot de passe unique d’au moins 12 caractères.",
              "اختر كلمة مرور فريدة من 12 حرفاً على الأقل.",
            )}
          </p>
          <form action={passwordAction} className="client-form">
            <label>
              {t("Mot de passe actuel", "كلمة المرور الحالية")}
              <input
                name="current"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <label>
              {t("Nouveau mot de passe", "كلمة المرور الجديدة")}
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              {t(
                "Confirmer le nouveau mot de passe",
                "تأكيد كلمة المرور الجديدة",
              )}
              <input
                name="confirm"
                type="password"
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </label>
            <ResultMessage {...passwordState} />
            <button
              className="client-button primary"
              disabled={passwordPending}
            >
              {passwordPending
                ? t("Modification…", "جارٍ التغيير…")
                : t("Modifier le mot de passe", "تغيير كلمة المرور")}
            </button>
          </form>
        </section>
      </div>
      <form action={clientLogout} className="client-logout">
        <button className="client-button">
          <Icon name="logout" />
          {t("Me déconnecter", "تسجيل الخروج")}
        </button>
      </form>
    </>
  );
}
