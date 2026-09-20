"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { saveDraft, submitClaim } from "@/app/client/actions";
import type { Draft, PortalData } from "@/lib/client/model";
import { Icon } from "@/components/workspace/icon";
import { useLanguage, ResultMessage } from "./language";
import { FileUpload } from "./upload";

function localDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function Declaration({ data }: { data: PortalData }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [id] = useState(data.draftId);
  const [draft, setDraft] = useState<Draft>(
    () =>
      data.draft?.payload ?? {
        step: 0,
        safe: "",
        injury: "",
        occurredAt: "",
        city: "",
        location: "",
        contractId: data.contracts[0]?.id ?? "",
        drivable: "",
        statement: "",
        language,
        files: {},
      },
  );
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");
  const locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = [
    t("Votre sécurité", "سلامتك"),
    t("L’accident", "الحادث"),
    t("Votre véhicule", "مركبتك"),
    t("Les documents", "المستندات"),
    t("Vérifier et envoyer", "المراجعة والإرسال"),
  ];
  const step = draft.step;
  function change(values: Partial<Draft>) {
    setDraft((current) => ({
      ...current,
      ...values,
      files: { ...current.files, ...values.files },
    }));
    setDirty(true);
    setSaveState("waiting");
    setError("");
  }
  function move(next: number) {
    change({ step: next });
    requestAnimationFrame(() => heading.current?.focus());
  }
  useEffect(() => {
    if (!dirty || submitted || busy) return;
    let active = true;
    const timeout = setTimeout(async () => {
      setSaveState("saving");
      try {
        const result = await saveDraft(id, draft);
        if (active) setSaveState(result.error ? "error" : "saved");
      } catch {
        if (active) setSaveState("error");
      }
    }, 700);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [draft, id, dirty, submitted, busy]);
  useEffect(() => {
    if (!dirty || submitted || saveState === "saved") return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty, submitted, saveState]);
  async function saveAndLeave() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await saveDraft(id, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDirty(false);
      router.push("/client");
    } catch {
      setError("network");
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || uploads > 0) return;
    if (step === 0 && (draft.safe !== "yes" || !draft.injury)) {
      setError("invalid");
      return;
    }
    if (
      step === 1 &&
      (!draft.occurredAt || new Date(draft.occurredAt).getTime() > Date.now())
    ) {
      setError("invalid");
      return;
    }
    if (step < 4) {
      move(step + 1);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await submitClaim(id, draft);
      if (result.error || !result.reference) {
        setError(result.error ?? "submit");
        return;
      }
      setSubmitted(result.reference);
      setDirty(false);
    } catch {
      setError("network");
    } finally {
      setBusy(false);
      locked.current = false;
    }
  }
  const uploadBusy = (value: boolean) =>
    setUploads((count) => count + (value ? 1 : -1));
  if (submitted)
    return (
      <section className="client-confirmation">
        <span className="client-confirmation-icon">
          <Icon name="check" size={34} />
        </span>
        <span className="client-kicker">
          {t("DÉCLARATION ENVOYÉE", "تم إرسال التصريح")}
        </span>
        <h1>
          {t(
            "C’est reçu. Nous prenons le relais.",
            "تم الاستلام. سنتولى المتابعة.",
          )}
        </h1>
        <p>
          {t(
            "Votre déclaration a été transmise à votre cabinet. Retrouvez son avancement et ajoutez vos documents à tout moment.",
            "تم إرسال تصريحك إلى وكالتك. يمكنك متابعة تقدمه وإضافة المستندات في أي وقت.",
          )}
        </p>
        <p className="client-confirmation-reference" dir="ltr">
          {submitted}
        </p>
        <Link
          className="client-button primary"
          href={`/client/dossiers/${submitted}` as Route}
        >
          {t("Suivre mon dossier", "تتبع ملفي")}
          <Icon name="arrow" />
        </Link>
        <Link className="client-text-link" href="/client">
          {t("Retour à l’accueil", "العودة للرئيسية")}
        </Link>
      </section>
    );
  if (!data.contracts.length)
    return (
      <section className="client-empty">
        <h1>{t("Retrouvons d’abord votre contrat.", "لنجد عقدك أولاً.")}</h1>
        <p>
          {t(
            "Aucun véhicule n’est encore rattaché à votre espace. Contactez votre cabinet pour l’ajouter et pouvoir déclarer votre sinistre.",
            "لا توجد مركبة مرتبطة بفضائك بعد. اتصل بوكالتك لإضافتها والتصريح بالحادث.",
          )}
        </p>
        <Link href="/client" className="client-button">
          {t("Retour à l’accueil", "العودة للرئيسية")}
        </Link>
      </section>
    );
  return (
    <div className="client-wizard">
      <div className="client-wizard-top">
        <Link className="client-text-link" href="/client">
          {t("← Accueil", "الرئيسية ←")}
        </Link>
        <button
          type="button"
          className="client-text-link"
          disabled={busy || uploads > 0}
          onClick={() => void saveAndLeave()}
        >
          {t("Enregistrer et reprendre plus tard", "الحفظ والمتابعة لاحقاً")}
        </button>
      </div>
      <div className="client-page-heading">
        <span className="client-kicker">
          {t("DÉCLARER UN SINISTRE", "التصريح بحادث")}
        </span>
        <h1>{t("Une étape à la fois.", "خطوة بخطوة.")}</h1>
        <p>
          {t(
            "Prenez le temps qu’il vous faut. Votre progression est enregistrée.",
            "خذ الوقت الذي تحتاجه. يتم حفظ تقدمك.",
          )}
        </p>
      </div>
      <ol
        className="client-wizard-steps"
        aria-label={t("Étapes de la déclaration", "مراحل التصريح")}
      >
        {steps.map((label, index) => (
          <li
            key={index}
            className={index <= step ? "active" : ""}
            aria-current={index === step ? "step" : undefined}
          >
            <span>
              {index < step ? <Icon name="check" size={15} /> : index + 1}
            </span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => void next(event)}
        className="client-panel client-form client-wizard-form"
      >
        <div className="client-step-title">
          <span>{t(`ÉTAPE ${step + 1} SUR 5`, `الخطوة ${step + 1} من 5`)}</span>
          <h2 ref={heading} tabIndex={-1}>
            {steps[step]}
          </h2>
        </div>
        <fieldset disabled={busy || uploads > 0}>
          {step === 0 && (
            <div className="client-form">
              <p>
                {t(
                  "Avant tout, assurez-vous d’être en sécurité. En cas d’urgence, contactez les services de secours avant de remplir cette déclaration.",
                  "قبل كل شيء، تأكد من أنك في أمان. في حالة الطوارئ، اتصل بخدمات الإسعاف قبل ملء هذا التصريح.",
                )}
              </p>
              <Choices
                label={t(
                  "Êtes-vous en sécurité pour continuer ?",
                  "هل أنت في أمان للمتابعة؟",
                )}
                value={draft.safe}
                options={[
                  ["yes", t("Oui, je peux continuer", "نعم، يمكنني المتابعة")],
                  ["no", t("Pas encore", "ليس بعد")],
                ]}
                onChange={(value) => change({ safe: value })}
              />
              {draft.safe === "no" && (
                <p className="client-safety" role="alert">
                  {t(
                    "Votre sécurité passe en premier. Vous pourrez revenir ici plus tard. Ce formulaire n’est pas un service d’urgence.",
                    "سلامتك أولاً. يمكنك العودة لاحقاً. هذه الاستمارة ليست خدمة طوارئ.",
                  )}
                </p>
              )}
              <Choices
                label={t(
                  "Y a-t-il des personnes blessées ?",
                  "هل هناك أشخاص مصابون؟",
                )}
                value={draft.injury}
                options={[
                  ["none", t("Non", "لا")],
                  ["yes", t("Oui", "نعم")],
                  ["unknown", t("Je ne sais pas encore", "لا أعرف بعد")],
                ]}
                onChange={(value) => change({ injury: value })}
              />
              {["yes", "unknown"].includes(draft.injury) && (
                <p className="client-safety">
                  {t(
                    "En cas de besoin urgent, contactez les secours. Nous signalerons cette situation à votre cabinet pour un suivi attentif.",
                    "إذا كانت هناك حاجة عاجلة، اتصل بالإسعاف. سننبه وكالتك لهذه الحالة لمتابعتها بعناية.",
                  )}
                </p>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="client-form">
              <p>
                {t(
                  "Quelques repères suffisent pour commencer.",
                  "بعض التفاصيل تكفي للبدء.",
                )}
              </p>
              <label>
                {t("Quand l’accident a-t-il eu lieu ?", "متى وقع الحادث؟")}
                <input
                  type="datetime-local"
                  required
                  value={localDate(draft.occurredAt)}
                  onChange={(e) =>
                    change({
                      occurredAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    })
                  }
                />
              </label>
              <label>
                {t("Dans quelle ville ?", "في أي مدينة؟")}
                <input
                  required
                  maxLength={120}
                  autoComplete="address-level2"
                  value={draft.city}
                  placeholder={t("Ex. Casablanca", "مثلاً الدار البيضاء")}
                  onChange={(e) => change({ city: e.target.value })}
                />
              </label>
              <label>
                {t("Où, plus précisément ?", "أين بالتحديد؟")}
                <input
                  required
                  maxLength={300}
                  value={draft.location}
                  placeholder={t(
                    "Une rue, un quartier ou un repère",
                    "شارع أو حي أو معلم قريب",
                  )}
                  onChange={(e) => change({ location: e.target.value })}
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="client-form">
              <label>
                {t("Quel véhicule est concerné ?", "ما هي المركبة المعنية؟")}
                <select
                  required
                  value={draft.contractId}
                  onChange={(e) => change({ contractId: e.target.value })}
                >
                  {data.contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.vehicle} · {contract.registration}
                    </option>
                  ))}
                </select>
              </label>
              <Choices
                label={t(
                  "Le véhicule peut-il encore rouler ?",
                  "هل تستطيع المركبة السير؟",
                )}
                value={draft.drivable}
                options={[
                  ["yes", t("Oui", "نعم")],
                  ["no", t("Non", "لا")],
                ]}
                onChange={(value) => change({ drivable: value })}
              />
              <label>
                {t("Racontez-nous ce qui s’est passé.", "أخبرنا بما حدث.")}
                <span className="client-field-hint">
                  {t(
                    "Avec vos mots. Mentionnez les véhicules ou personnes impliqués, si vous le savez.",
                    "بكلماتك الخاصة. اذكر المركبات أو الأشخاص المعنيين إن كنت تعرفهم.",
                  )}
                </span>
                <textarea
                  rows={5}
                  required
                  minLength={10}
                  maxLength={4000}
                  dir="auto"
                  value={draft.statement}
                  placeholder={t("Je circulais…", "كنت أقود…")}
                  onChange={(e) =>
                    change({ statement: e.target.value, language })
                  }
                />
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="client-form">
              <p>
                {t(
                  "Vous avez un constat ou une photo ? Ajoutez-les ici. Sinon, vous pourrez les transmettre après l’envoi de votre déclaration.",
                  "هل لديك معاينة ودية أو صورة؟ أضفها هنا. وإلا يمكنك إرسالها بعد تقديم التصريح.",
                )}
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="client-review">
              <p>
                {t(
                  "Relisez tranquillement. Vous pouvez encore modifier chaque étape.",
                  "راجع المعلومات بهدوء. يمكنك تعديل كل خطوة.",
                )}
              </p>
              {[
                [
                  0,
                  t("Sécurité", "السلامة"),
                  draft.injury === "none"
                    ? t("Aucune blessure signalée", "لم يتم الإبلاغ عن إصابات")
                    : draft.injury === "yes"
                      ? t("Blessure signalée", "تم الإبلاغ عن إصابة")
                      : t("Blessures à confirmer", "الإصابات غير مؤكدة"),
                ],
                [
                  1,
                  t("L’accident", "الحادث"),
                  `${draft.city} · ${draft.location} · ${localDate(draft.occurredAt).replace("T", " ")}`,
                ],
                [
                  2,
                  t("Le véhicule", "المركبة"),
                  `${data.contracts.find((c) => c.id === draft.contractId)?.vehicle ?? ""} · ${draft.drivable === "yes" ? t("Peut rouler", "يمكنها السير") : t("Ne peut pas rouler", "لا يمكنها السير")}`,
                ],
                [
                  3,
                  t("Documents ajoutés", "المستندات المضافة"),
                  t(
                    `${Object.keys(draft.files).length} fichier(s) · vous pourrez compléter plus tard`,
                    `${Object.keys(draft.files).length} ملفات · يمكنك الإكمال لاحقاً`,
                  ),
                ],
              ].map(([index, label, value]) => (
                <div className="client-review-row" key={index}>
                  <div>
                    <strong>{label}</strong>
                    <p>{value}</p>
                  </div>
                  <button
                    type="button"
                    className="client-text-link"
                    onClick={() => move(Number(index))}
                  >
                    {t("Modifier", "تعديل")}
                  </button>
                </div>
              ))}
              <blockquote dir="auto">{draft.statement}</blockquote>
              <label className="client-consent">
                <input type="checkbox" required />
                {t(
                  "Je confirme que ces informations correspondent à ma déclaration.",
                  "أؤكد أن هذه المعلومات تطابق تصريحي.",
                )}
              </label>
            </div>
          )}
        </fieldset>
        {step === 3 && (
          <div className="client-form">
            <FileUpload
              userId={data.profile.id}
              folder={id}
              label={t(
                "Constat amiable · facultatif à cette étape",
                "المعاينة الودية · اختيارية في هذه المرحلة",
              )}
              done={Boolean(draft.files.constat)}
              onBusy={uploadBusy}
              onUploaded={(path) => {
                change({ files: { ...draft.files, constat: path } });
              }}
            />
            <FileUpload
              userId={data.profile.id}
              folder={id}
              label={t(
                "Photo du véhicule · facultative",
                "صورة المركبة · اختيارية",
              )}
              done={Boolean(draft.files.photos)}
              onBusy={uploadBusy}
              onUploaded={(path) => {
                change({ files: { ...draft.files, photos: path } });
              }}
            />
          </div>
        )}
        <ResultMessage error={error} />
        <div className="client-wizard-controls">
          {step > 0 && (
            <button
              type="button"
              className="client-button"
              disabled={busy || uploads > 0}
              onClick={() => move(step - 1)}
            >
              {t("Retour", "رجوع")}
            </button>
          )}
          <button
            className="client-button primary"
            disabled={
              busy || uploads > 0 || (step === 0 && draft.safe === "no")
            }
          >
            {busy
              ? t("Un instant…", "لحظة…")
              : step === 4
                ? t("Envoyer ma déclaration", "إرسال تصريحي")
                : step === 3
                  ? t("Continuer vers le récapitulatif", "متابعة إلى الملخص")
                  : t("Continuer", "متابعة")}
            <Icon name="arrow" />
          </button>
        </div>
      </form>
      <p
        className={`client-save-state ${saveState === "error" ? "client-error" : ""}`}
        role="status"
      >
        {saveState === "error"
          ? t(
              "Sauvegarde interrompue. Utilisez « Enregistrer et reprendre plus tard » pour réessayer.",
              "تعذر الحفظ. استخدم «الحفظ والمتابعة لاحقاً» لإعادة المحاولة.",
            )
          : saveState === "saved"
            ? dirty || data.draft
              ? t("Votre progression est enregistrée.", "تم حفظ تقدمك.")
              : t(
                  "Vos réponses seront enregistrées automatiquement.",
                  "سيتم حفظ إجاباتك تلقائياً.",
                )
            : t("Enregistrement de votre progression…", "جارٍ حفظ تقدمك…")}
      </p>
    </div>
  );
}
function Choices({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="client-choices">
      <legend>{label}</legend>
      <div>
        {options.map(([key, text]) => (
          <label key={key} className={value === key ? "selected" : ""}>
            <input
              type="radio"
              name={label}
              value={key}
              checked={value === key}
              required
              onChange={() => onChange(key)}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
