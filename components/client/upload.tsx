"use client";
import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/workspace/icon";
import { useLanguage } from "./language";
export function FileUpload({
  userId,
  folder,
  avatar = false,
  label,
  done,
  onUploaded,
  onBusy,
}: {
  userId: string;
  folder: string;
  avatar?: boolean;
  label: string;
  done?: boolean;
  onUploaded: (path: string) => Promise<void> | void;
  onBusy?: (busy: boolean) => void;
}) {
  const { t } = useLanguage();
  const id = useId();
  const lastFile = useRef<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  async function upload(file: File) {
    lastFile.current = file;
    const max = avatar ? 2 : 10;
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        ...(avatar ? [] : ["application/pdf"]),
      ].includes(file.type) ||
      file.size > max * 1024 * 1024
    ) {
      setError(
        t(
          `Choisissez une image${avatar ? "" : " ou un PDF"} de moins de ${max} Mo.`,
          `اختر ${avatar ? "صورة" : "صورة أو ملف PDF"} أصغر من ${max} ميغابايت.`,
        ),
      );
      return;
    }
    setBusy(true);
    onBusy?.(true);
    setError("");
    try {
      const db = createClient();
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      }[file.type];
      const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage
        .from(avatar ? "avatars" : "client-documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      await onUploaded(path);
      setName(file.name);
    } catch {
      setError(
        t(
          "L’envoi n’a pas abouti. Votre fichier reste disponible pour réessayer.",
          "لم يكتمل الإرسال. يمكنك إعادة المحاولة بنفس الملف.",
        ),
      );
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <div className="client-upload" aria-busy={busy}>
      <Icon name={done || name ? "check" : "file"} size={22} />
      <div>
        <strong>{label}</strong>
        <p>
          {name ||
            (done
              ? t("Fichier ajouté", "تمت إضافة الملف")
              : t(
                  avatar
                    ? "JPG, PNG ou WebP · 2 Mo maximum"
                    : "Photo ou PDF · 10 Mo maximum",
                  avatar
                    ? "JPG أو PNG أو WebP · حتى 2 ميغابايت"
                    : "صورة أو PDF · حتى 10 ميغابايت",
                ))}
        </p>
        <label className="client-text-link" htmlFor={id}>
          {busy
            ? t("Envoi en cours…", "جارٍ الإرسال…")
            : done || name
              ? t("Choisir un autre fichier", "اختيار ملف آخر")
              : t("Choisir un fichier", "اختيار ملف")}
        </label>
        <input
          className="client-file-input"
          id={id}
          type="file"
          disabled={busy}
          accept={
            avatar
              ? "image/jpeg,image/png,image/webp"
              : "image/jpeg,image/png,image/webp,application/pdf"
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        {!avatar && (
          <label
            className="client-text-link client-camera"
            htmlFor={`${id}-camera`}
          >
            {t("Prendre une photo", "التقاط صورة")}
            <input
              className="client-file-input"
              id={`${id}-camera`}
              type="file"
              disabled={busy}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {busy && <progress aria-label={t("Envoi du fichier", "إرسال الملف")} />}
        {error && (
          <div role="alert">
            <p className="client-error">{error}</p>
            <button
              type="button"
              className="client-text-link"
              onClick={() => lastFile.current && void upload(lastFile.current)}
            >
              {t("Réessayer", "إعادة المحاولة")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
