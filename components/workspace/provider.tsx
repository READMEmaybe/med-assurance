"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { logout, mutateClaim } from "@/app/actions";
import type { ClaimMutation, WorkspaceData } from "@/lib/domain/claims/model";
import { mutateDemo } from "@/lib/demo/mutate";
import { Icon } from "./icon";

type ToastData = { id: string; message: string; undo?: ClaimMutation };
type Context = {
  data: WorkspaceData;
  demo: boolean;
  now: string;
  pending: boolean;
  href: (path: string) => Route;
  mutate: (
    input: ClaimMutation,
    message?: string,
    undo?: ClaimMutation,
  ) => Promise<boolean>;
};
const WorkspaceContext = createContext<Context | null>(null);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace unavailable");
  return context;
}

function Toast({
  toast,
  dismiss,
  undo,
}: {
  toast: ToastData;
  dismiss: () => void;
  undo: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(7000);
  useEffect(() => {
    if (paused) return;
    let previous = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      setRemaining((r) => Math.max(0, r - (now - previous)));
      previous = now;
    }, 100);
    return () => clearInterval(timer);
  }, [paused]);
  useEffect(() => {
    if (remaining === 0) dismiss();
  }, [remaining, dismiss]);
  return (
    <div
      className="toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <Icon name="check" />
      <span>{toast.message}</span>
      {toast.undo && <button onClick={undo}>Annuler</button>}
      <button aria-label="Fermer la notification" onClick={dismiss}>
        <Icon name="close" size={14} />
      </button>
      <div className="toast-progress" style={{ width: `${remaining / 70}%` }} />
    </div>
  );
}

export function WorkspaceProvider({
  initialData,
  demo = false,
  now,
  children,
}: {
  initialData: WorkspaceData;
  demo?: boolean;
  now: string;
  children: ReactNode;
}) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const pathname = usePathname();
  const href = (path: string): Route => (demo ? `/demo${path}` : path) as Route;
  const dismiss = (id: string) =>
    setToasts((items) => items.filter((t) => t.id !== id));
  async function mutate(
    input: ClaimMutation,
    message = "Modification enregistrée",
    undo?: ClaimMutation,
  ) {
    if (locked.current) return false;
    locked.current = true;
    setPending(true);
    setError("");
    const previous = data;
    try {
      if (demo) setData(mutateDemo(data, input));
      else {
        if (input.kind === "task_toggle") setData(mutateDemo(data, input));
        const result = await mutateClaim(input).catch(() => {
          throw new Error(
            "Connexion interrompue. Vérifiez le réseau puis réessayez.",
          );
        });
        if (result.error || !result.data)
          throw new Error(result.error ?? "Modification non enregistrée.");
        setData(result.data);
      }
      setToasts((items) =>
        [
          ...items,
          {
            id: crypto.randomUUID(),
            message: demo
              ? message.replace("enregistrée", "appliquée à la démo")
              : message,
            undo,
          },
        ].slice(-3),
      );
      return true;
    } catch (err) {
      setData(previous);
      setError(
        err instanceof Error
          ? err.message
          : "Connexion interrompue. Réessayez.",
      );
      return false;
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  const open = data.claims.filter((c) => c.status !== "clos");
  const taskCount = open
    .flatMap((c) => c.tasks)
    .filter((t) => !t.completed_at).length;
  const role = {
    agent: "Agent",
    supervisor: "Superviseure",
    admin: "Administrateur",
    client: "Client",
  }[data.profile.role];
  const initials = data.profile.full_name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <WorkspaceContext.Provider
      value={{ data, demo, now, pending, href, mutate }}
    >
      <div className="workspace">
        <aside className="sidebar">
          {!demo && (
            <form className="mobile-logout" action={logout}>
              <button className="icon-button" aria-label="Se déconnecter">
                <Icon name="logout" />
              </button>
            </form>
          )}
          <Link href={href("/accueil")} className="workspace-brand">
            <span className="brand-mark">
              m<span>·</span>
            </span>
            <span>
              med<span className="brand-light">assurance</span>
              <small>ESPACE COURTIER</small>
            </span>
          </Link>
          <div className="cabinet">
            <span className="cabinet-symbol">M</span>
            <div>
              Cabinet Med Assurance<small>Automobile · Maroc</small>
            </div>
            <span className="muted" aria-hidden="true">
              ⌄
            </span>
          </div>
          <p className="nav-caption">ESPACE DE TRAVAIL</p>
          <nav aria-label="Navigation principale">
            {(
              [
                ["/accueil", "Accueil", "home", null],
                ["/sinistres", "Sinistres", "claims", open.length],
                ["/taches", "Tâches", "tasks", taskCount],
              ] as const
            ).map(([path, label, icon, count]) => (
              <Link
                key={path}
                href={href(path)}
                aria-current={
                  pathname.includes(path) ||
                  (path === "/accueil" && pathname === "/demo")
                    ? "page"
                    : undefined
                }
              >
                <Icon name={icon} />
                <span>{label}</span>
                {count !== null && <small>{count}</small>}
              </Link>
            ))}
          </nav>
          {!demo && (
            <Link
              className="broker-account-link"
              href="/compte"
              aria-current={pathname === "/compte" ? "page" : undefined}
            >
              Mon compte · Mot de passe
            </Link>
          )}
          <div className="sidebar-foot">
            <div className="sidebar-note">
              <span className="availability-dot" />
              {demo ? "Démonstration interactive" : "Espace sécurisé"}
              <p>
                {demo
                  ? "Les cinq situations du quotidien, réunies dans votre espace."
                  : "Chaque modification est consignée dans l’historique du dossier."}
              </p>
            </div>
            <div className="profile">
              <span className="avatar">{initials}</span>
              <div>
                {data.profile.full_name}
                <small>{role}</small>
              </div>
              {!demo && (
                <form action={logout}>
                  <button className="icon-button" aria-label="Se déconnecter">
                    <Icon name="logout" size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </aside>
        <div className="workspace-main">
          <header className="workspace-top">
            <span>
              Cabinet <span className="breadcrumb-slash">/</span>{" "}
              <strong>Automobile</strong>
            </span>
            <span className="top-right">
              <span className="availability-dot" />
              {demo ? "Données de démonstration" : role}
              <span className="avatar small">{initials}</span>
            </span>
          </header>
          {demo && (
            <div className="demo-banner">
              <span>
                Démo · données fictives. Vos essais restent dans cette session
                et sont effacés au rechargement.
              </span>
              <button
                disabled={pending}
                onClick={() => {
                  setData(structuredClone(initialData));
                  setToasts([]);
                  setError("");
                }}
              >
                Réinitialiser
              </button>
              <Link href="/login">
                Connexion <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
          <main id="contenu" className="workspace-content">
            {children}
          </main>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Fermer l’erreur"
              onClick={() => setError("")}
            >
              <Icon name="close" />
            </button>
          </div>
        )}
        <div
          className="toast-stack"
          aria-live="polite"
          aria-relevant="additions"
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              dismiss={() => dismiss(toast.id)}
              undo={() => {
                if (toast.undo)
                  void mutate(toast.undo, "Suivi rouvert").then((ok) => {
                    if (ok) dismiss(toast.id);
                  });
              }}
            />
          ))}
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
