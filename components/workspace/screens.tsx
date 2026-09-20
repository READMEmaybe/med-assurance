"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  attentionItems,
  documentLabels,
  nextAction,
  priorityLabels,
  type Claim,
  type ClaimTask,
} from "@/lib/domain/claims/model";
import {
  claimStatusLabels,
  type ClaimStatus,
} from "@/lib/domain/claims/status";
import { useWorkspace } from "./provider";
import { Icon } from "./icon";

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function date(value: string, time = false, year = false) {
  const key = `${time}-${year}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      ...(year ? { year: "numeric" as const } : {}),
      ...(time ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
      timeZone: "UTC",
    });
    dateFormatters.set(key, formatter);
  }
  return formatter.format(new Date(new Date(value).getTime() + 3_600_000));
}
function searchText(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
}
function Status({ status }: { status: ClaimStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span aria-hidden="true" />
      {claimStatusLabels[status]}
    </span>
  );
}
function Priority({ claim }: { claim: Claim }) {
  return (
    <span className={`priority priority-${claim.priority}`}>
      <span aria-hidden="true">
        {claim.priority === "critique"
          ? "↑↑"
          : claim.priority === "haute"
            ? "↑"
            : "−"}
      </span>
      {priorityLabels[claim.priority]}
    </span>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name="claims" size={28} />
      {children}
    </div>
  );
}

function TaskRow({
  claim,
  task,
  showClaim = false,
}: {
  claim: Claim;
  task: ClaimTask;
  showClaim?: boolean;
}) {
  const { mutate, pending, href, now } = useWorkspace();
  const completed = Boolean(task.completed_at);
  const overdue =
    !completed &&
    claim.status !== "clos" &&
    new Date(task.due_at).getTime() < new Date(now).getTime();
  return (
    <div className={`task-row ${completed ? "task-completed" : ""}`}>
      <button
        className="task-checkbox"
        aria-label={`${completed ? "Rouvrir" : "Terminer"} : ${task.title}`}
        aria-pressed={completed}
        disabled={pending || claim.status === "clos"}
        onClick={() =>
          void mutate(
            {
              kind: "task_toggle",
              claimId: claim.id,
              taskId: task.id,
              completed: !completed,
              expectedCompleted: completed,
            },
            completed ? "Suivi rouvert" : "Suivi terminé",
            completed
              ? undefined
              : {
                  kind: "task_toggle",
                  claimId: claim.id,
                  taskId: task.id,
                  completed: false,
                  expectedCompleted: true,
                },
          )
        }
      >
        {completed && <Icon name="check" size={13} />}
      </button>
      <div className="task-text">
        <span>{task.title}</span>
        {showClaim && (
          <Link href={href(`/sinistres/${claim.reference}`)}>
            {claim.reference} · {claim.client.full_name}
          </Link>
        )}
      </div>
      <span className={`task-date ${overdue ? "overdue" : ""}`}>
        {overdue && <span>En retard · </span>}
        {date(task.due_at, true)}
      </span>
    </div>
  );
}

function ClaimFacts({ claim }: { claim: Claim }) {
  return (
    <dl className="facts">
      <div>
        <dt>Client</dt>
        <dd>
          {claim.client.full_name}
          <small>
            {claim.client.phone} · {claim.client.language.toUpperCase()}
          </small>
        </dd>
      </div>
      <div>
        <dt>Véhicule</dt>
        <dd>
          {claim.contract.vehicle}
          <small>{claim.contract.registration}</small>
        </dd>
      </div>
      <div>
        <dt>Contrat</dt>
        <dd>
          {claim.contract.reference}
          <small>
            {claim.contract.insurer} · échéance{" "}
            {date(claim.contract.valid_to, false, true)}
          </small>
        </dd>
      </div>
      <div>
        <dt>Accident</dt>
        <dd>
          {claim.city}
          <small>{date(claim.occurred_at, true)}</small>
        </dd>
      </div>
    </dl>
  );
}

export function ClaimsScreen() {
  const { data, href } = useWorkspace();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const filter = params.get("filter") ?? "all";
  const sort = params.get("sort") ?? "priority";
  const [previewId, setPreviewId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = data.claims.find((c) => c.id === previewId);
  function update(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    // Filtering uses the data already in memory; keep the URL shareable without a server round trip.
    window.history.replaceState(
      null,
      "",
      `${pathname}?${next}${window.location.hash}`,
    );
  }
  const active = data.claims.filter((c) => c.status !== "clos");
  const attention = active.filter(
    (c) =>
      c.priority === "critique" ||
      c.injury_state !== "none" ||
      c.has_conflict ||
      (!c.vehicle_drivable && c.assistance_status !== "verifiee"),
  );
  const searchIndex = useMemo(
    () =>
      data.claims.map((claim) => ({
        claim,
        text: searchText(
          `${claim.reference} ${claim.client.full_name} ${claim.city} ${claim.contract.reference} ${claim.contract.registration}`,
        ),
      })),
    [data.claims],
  );
  const needle = searchText(query);
  const matches = searchIndex
    .filter(({ claim: c, text }) => {
      return (
        text.includes(needle) &&
        (filter === "all" ||
          (filter === "attention" && attention.includes(c)) ||
          (filter === "waiting" && c.status === "en_attente_client") ||
          (filter === "closed" && c.status === "clos") ||
          (filter === "mine" && c.assigned_agent_id === data.profile.id))
      );
    })
    .map(({ claim }) => claim)
    .sort((a, b) =>
      sort === "recent"
        ? new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        : sort === "client"
          ? a.client.full_name.localeCompare(b.client.full_name, "fr")
          : { critique: 0, haute: 1, normale: 2 }[a.priority] -
              { critique: 0, haute: 1, normale: 2 }[b.priority] ||
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">VOTRE FILE DE TRAVAIL</div>
          <h1>
            Sinistres{" "}
            <span className="heading-count">{data.claims.length}</span>
          </h1>
          <p>Chaque dossier, sa prochaine étape.</p>
        </div>
        <span className="heading-meta">{active.length} dossiers ouverts</span>
      </div>
      <div className="list-tabs" aria-label="Filtres de sinistres">
        {[
          ["all", "Tous les dossiers", data.claims.length],
          ["attention", "À surveiller", attention.length],
          [
            "waiting",
            "En attente client",
            active.filter((c) => c.status === "en_attente_client").length,
          ],
          [
            "mine",
            "Mes dossiers",
            active.filter((c) => c.assigned_agent_id === data.profile.id)
              .length,
          ],
          ["closed", "Clos", data.claims.length - active.length],
        ].map(([value, label, count]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => update("filter", String(value))}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <div className="list-toolbar">
        <label className="search-field">
          <Icon name="search" size={17} />
          <input
            aria-label="Rechercher un sinistre"
            placeholder="Rechercher un client, un dossier, une plaque…"
            value={query}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <label className="sort-field">
          Trier par{" "}
          <select
            aria-label="Trier les sinistres"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="priority">Priorité</option>
            <option value="recent">Activité récente</option>
            <option value="client">Client</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table className="claims-table">
          <caption className="sr-only">
            Sinistres accessibles · sélectionner une référence pour ouvrir
            l’aperçu
          </caption>
          <thead>
            <tr>
              <th scope="col">Dossier / Client</th>
              <th scope="col">Statut</th>
              <th scope="col">Priorité</th>
              <th scope="col">Prochaine action</th>
              <th scope="col">Responsable</th>
              <th scope="col">Activité</th>
              <th scope="col">
                <span className="sr-only">Ouvrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((c) => (
              <tr
                key={c.id}
                onClick={() => {
                  setPreviewId(c.id);
                  dialog.current?.showModal();
                }}
              >
                <td>
                  <button
                    className="claim-cell"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewId(c.id);
                      dialog.current?.showModal();
                    }}
                  >
                    <span
                      className={`client-avatar avatar-${c.client.language === "ar" ? "sand" : c.priority === "normale" ? "sage" : "blue"}`}
                    >
                      {initials(c.client.full_name)}
                    </span>
                    <span>
                      <strong>{c.client.full_name}</strong>
                      <small>
                        {c.reference} <span>· {c.city}</span>
                      </small>
                    </span>
                  </button>
                </td>
                <td>
                  <Status status={c.status} />
                </td>
                <td>
                  <Priority claim={c} />
                </td>
                <td className="next-cell">{nextAction(c)}</td>
                <td>
                  <span className="assignee-cell">
                    <span className="avatar tiny">
                      {c.assigned_agent_id
                        ? initials(
                            data.profiles.find(
                              (p) => p.id === c.assigned_agent_id,
                            )?.full_name ?? "-",
                          )
                        : "-"}
                    </span>
                    {data.profiles
                      .find((p) => p.id === c.assigned_agent_id)
                      ?.full_name.split(" ")[0] ?? "Non attribué"}
                  </span>
                </td>
                <td className="activity-cell">{date(c.updated_at)}</td>
                <td>
                  <Icon name="chevron" size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!matches.length && (
        <Empty>
          <h2>Aucun dossier ne correspond.</h2>
          <p>Essayez un autre nom ou retirez les filtres.</p>
          <button
            className="button"
            onClick={() => window.history.replaceState(null, "", pathname)}
          >
            Effacer les filtres
          </button>
        </Empty>
      )}
      <div className="table-footer">
        <span>
          {matches.length} dossier{matches.length > 1 ? "s" : ""}
        </span>
        <span>Ouvrez un aperçu pour garder votre file à portée de main.</span>
      </div>
      <dialog
        ref={dialog}
        className="preview-drawer"
        aria-labelledby="preview-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        onClose={() => setPreviewId(null)}
      >
        {preview && (
          <div className="drawer-inner">
            <div className="drawer-header">
              <span>Aperçu du dossier</span>
              <button
                className="icon-button"
                aria-label="Fermer l’aperçu"
                onClick={() => dialog.current?.close()}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="drawer-body">
              <div className="eyebrow">{preview.reference}</div>
              <h2 id="preview-title">{preview.client.full_name}</h2>
              <div className="record-badges">
                <Status status={preview.status} />
                <Priority claim={preview} />
              </div>
              <div className="next-action-box">
                <span className="eyebrow">PROCHAINE ACTION</span>
                <h3>{nextAction(preview)}</h3>
              </div>
              <ClaimFacts claim={preview} />
              <section>
                <h3>Déclaration originale</h3>
                <p
                  className="statement"
                  dir={preview.statement_language === "ar" ? "rtl" : "ltr"}
                  lang={preview.statement_language}
                >
                  {preview.statement}
                </p>
              </section>
              <section>
                <h3>Suivis</h3>
                {preview.tasks.map((t) => (
                  <TaskRow key={t.id} claim={preview} task={t} />
                ))}
              </section>
            </div>
            <div className="drawer-footer">
              <Link
                className="button primary"
                href={href(`/sinistres/${preview.reference}`)}
                onClick={() => dialog.current?.close()}
              >
                Ouvrir le dossier complet <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

export function HomeScreen() {
  const { data, href, now, demo } = useWorkspace();
  const open = data.claims.filter((c) => c.status !== "clos");
  const tasks = open
    .flatMap((c) =>
      c.tasks
        .filter((t) => !t.completed_at)
        .map((t) => ({ claim: c, task: t })),
    )
    .sort(
      (a, b) =>
        new Date(a.task.due_at).getTime() - new Date(b.task.due_at).getTime(),
    );
  const urgent = [...open]
    .sort(
      (a, b) =>
        ({ critique: 0, haute: 1, normale: 2 })[a.priority] -
        { critique: 0, haute: 1, normale: 2 }[b.priority],
    )
    .slice(0, 4);
  return (
    <>
      <div className="page-heading home-heading">
        <div>
          <div className="eyebrow">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })
              .format(new Date(new Date(now).getTime() + 3_600_000))
              .toUpperCase()}
            {demo && " · JOURNÉE DÉMO"}
          </div>
          <h1>
            Bonjour {data.profile.full_name.split(" ")[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p>Faisons avancer les dossiers qui comptent aujourd’hui.</p>
        </div>
        <Link href={href("/sinistres")} className="button">
          Voir les sinistres <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="summary-strip">
        <Link href={href("/sinistres")}>
          <span>Dossiers ouverts</span>
          <strong>{open.length.toString().padStart(2, "0")}</strong>
          <small>Dans votre périmètre</small>
        </Link>
        <Link href={href("/sinistres?filter=attention")}>
          <span>Intervention requise</span>
          <strong className="text-amber">
            {open
              .filter((c) => c.injury_state !== "none")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Une attention humaine</small>
        </Link>
        <Link href={href("/sinistres?filter=waiting")}>
          <span>En attente client</span>
          <strong>
            {open
              .filter((c) => c.status === "en_attente_client")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Gardez le lien</small>
        </Link>
        <Link href={href("/taches?filter=overdue")}>
          <span>Suivis en retard</span>
          <strong className="text-amber">
            {tasks
              .filter(
                ({ task }) =>
                  new Date(task.due_at).getTime() < new Date(now).getTime(),
              )
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>À reprendre en priorité</small>
        </Link>
      </div>
      <div className="home-grid">
        <section>
          <div className="section-heading">
            <h2>
              À traiter en priorité <span className="subtle-dot" />
            </h2>
            <Link href={href("/sinistres")}>
              Tout voir <Icon name="arrow" size={14} />
            </Link>
          </div>
          <div className="priority-list">
            {urgent.map((c, i) => (
              <Link
                className="priority-card"
                key={c.id}
                href={href(`/sinistres/${c.reference}`)}
              >
                <span className="priority-index">0{i + 1}</span>
                <div>
                  <div className="priority-card-top">
                    <strong>{c.client.full_name}</strong>
                    <Priority claim={c} />
                  </div>
                  <p>{nextAction(c)}</p>
                  <small>
                    {c.reference} <span>· {c.city}</span>
                  </small>
                </div>
                <Icon name="arrow" size={17} />
              </Link>
            ))}
            {!urgent.length && (
              <Empty>
                <h2>Votre file est à jour.</h2>
                <p>Aucun dossier ouvert à traiter.</p>
              </Empty>
            )}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2>Vos prochains suivis</h2>
            <Link href={href("/taches")}>
              Tout voir <Icon name="arrow" size={14} />
            </Link>
          </div>
          <div className="home-tasks">
            {tasks.slice(0, 5).map(({ claim, task }) => (
              <TaskRow key={task.id} claim={claim} task={task} showClaim />
            ))}
            {!tasks.length && (
              <Empty>
                <p>Tous les suivis sont terminés.</p>
              </Empty>
            )}
          </div>
          <div className="quiet-note">
            <Icon name="clock" size={18} />
            <div>
              Un dossier avance, une étape à la fois.
              <p>
                Ajoutez un suivi depuis le dossier pour garder la prochaine
                action visible.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="workspace-bottom">
        <span className="availability-dot" />
        {demo
          ? "5 scénarios fictifs · date de référence : 19 septembre 2026"
          : "Données du cabinet · accès limité à votre périmètre"}
      </div>
    </>
  );
}

export function TasksScreen() {
  const { data, now } = useWorkspace();
  const params = useSearchParams();
  const [filter, setFilter] = useState(
    params.get("filter") === "overdue" ? "overdue" : "open",
  );
  const all = data.claims
    .flatMap((c) => c.tasks.map((task) => ({ claim: c, task })))
    .sort(
      (a, b) =>
        new Date(a.task.due_at).getTime() - new Date(b.task.due_at).getTime(),
    );
  const tasks = all.filter(({ claim, task }) =>
    filter === "done"
      ? Boolean(task.completed_at)
      : !task.completed_at &&
        claim.status !== "clos" &&
        (filter !== "overdue" ||
          new Date(task.due_at).getTime() < new Date(now).getTime()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">POUR NE RIEN OUBLIER</div>
          <h1>Tâches</h1>
          <p>Vos suivis, reliés aux dossiers qui en ont besoin.</p>
        </div>
      </div>
      <div className="list-tabs">
        {[
          ["open", "À faire"],
          ["overdue", "En retard"],
          ["done", "Terminées"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="task-workspace">
        {tasks.map(({ claim, task }) => (
          <TaskRow key={task.id} claim={claim} task={task} showClaim />
        ))}
        {!tasks.length && (
          <Empty>
            <h2>Aucun suivi dans cette vue.</h2>
            <p>
              Créez un suivi depuis un dossier ou consultez les autres vues.
            </p>
          </Empty>
        )}
      </div>
    </>
  );
}

export function RecordScreen({ reference }: { reference: string }) {
  const { data, href, mutate, pending } = useWorkspace();
  const claim = data.claims.find((c) => c.reference === reference);
  const [tab, setTab] = useState("summary");
  const taskInput = useRef<HTMLInputElement>(null);
  const noteRequest = useRef<string | null>(null);
  const taskRequest = useRef<string | null>(null);
  if (!claim)
    return (
      <Empty>
        <h1>Dossier inaccessible</h1>
        <p>Ce dossier n’existe pas ou ne fait pas partie de votre périmètre.</p>
        <Link className="button" href={href("/sinistres")}>
          Retour aux sinistres
        </Link>
      </Empty>
    );
  const current = claim;
  const closed = claim.status === "clos";
  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    noteRequest.current ??= crypto.randomUUID();
    if (
      await mutate(
        {
          kind: "note",
          claimId: current.id,
          body,
          requestId: noteRequest.current,
        },
        "Note ajoutée",
      )
    ) {
      form.reset();
      noteRequest.current = null;
    }
  }
  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title") ?? "").trim();
    const due = String(values.get("due") ?? "");
    taskRequest.current ??= crypto.randomUUID();
    if (
      await mutate(
        {
          kind: "task_create",
          claimId: current.id,
          title,
          dueAt: new Date(`${due}T17:00:00+01:00`).toISOString(),
          requestId: taskRequest.current,
        },
        "Suivi créé",
      )
    ) {
      form.reset();
      taskRequest.current = null;
    }
  }
  const items = attentionItems(claim);
  return (
    <>
      <Link href={href("/sinistres")} className="back-link">
        ← Sinistres <span>/</span> {claim.reference}
      </Link>
      <div className="page-heading record-heading">
        <div>
          <div className="eyebrow">{claim.reference} · SINISTRE AUTOMOBILE</div>
          <h1>{claim.client.full_name}</h1>
          <div className="record-badges">
            <Status status={claim.status} />
            <Priority claim={claim} />
            <span className="muted">
              {claim.city} · {date(claim.occurred_at)}
            </span>
          </div>
        </div>
        <label className="status-select">
          Statut du dossier
          <select
            aria-label="Statut du dossier"
            disabled={pending || claim.injury_state !== "none"}
            value={claim.status}
            onChange={(e) =>
              void mutate({
                kind: "status",
                claimId: claim.id,
                value: e.target.value as ClaimStatus,
                expected: claim.status,
              })
            }
          >
            {Object.entries(claimStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="record-grid">
        <div className="record-main">
          <div className="list-tabs record-tabs">
            {[
              ["summary", "Vue d’ensemble"],
              ["documents", `Documents · ${claim.documents.length}`],
              ["activity", "Activité"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "summary" && (
            <>
              <section className="record-section">
                <h2>Les informations essentielles</h2>
                <ClaimFacts claim={claim} />
              </section>
              <section className="record-section">
                <div className="section-heading">
                  <h2>Déclaration originale</h2>
                  <span className="language-tag">
                    {claim.statement_language === "ar" ? "العربية · AR" : "FR"}
                  </span>
                </div>
                <p
                  className="statement"
                  lang={claim.statement_language}
                  dir={claim.statement_language === "ar" ? "rtl" : "ltr"}
                >
                  {claim.statement}
                </p>
                {claim.translation && (
                  <div className="translation">
                    <span>Traduction de travail · français · à valider</span>
                    <p>{claim.translation}</p>
                  </div>
                )}
                <p className="record-meta">
                  {claim.location} · Véhicule{" "}
                  {claim.vehicle_drivable ? "roulant" : "immobilisé"}
                </p>
              </section>
              <section className="record-section">
                <div className="section-heading">
                  <h2>Suivis du dossier</h2>
                  <span className="muted">
                    {claim.tasks.filter((t) => !t.completed_at).length} à faire
                  </span>
                </div>
                {claim.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} claim={claim} />
                ))}
                {!claim.tasks.length && (
                  <p className="muted">Aucun suivi pour le moment.</p>
                )}
                <form className="task-form" onSubmit={addTask}>
                  <fieldset disabled={pending || closed}>
                    <label className="grow">
                      Prochain suivi
                      <input
                        ref={taskInput}
                        name="title"
                        placeholder="Ex. Relancer le client pour le constat"
                        required
                        maxLength={200}
                        onChange={() => {
                          taskRequest.current = null;
                        }}
                      />
                    </label>
                    <label>
                      Échéance
                      <input
                        name="due"
                        type="date"
                        required
                        onChange={() => {
                          taskRequest.current = null;
                        }}
                      />
                    </label>
                    <button className="button" type="submit">
                      Ajouter
                    </button>
                  </fieldset>
                </form>
              </section>
              <section className="record-section">
                <h2>
                  Notes internes{" "}
                  <span className="internal-label">Cabinet uniquement</span>
                </h2>
                {claim.notes.map((note) => (
                  <article key={note.id} className="note">
                    <p>{note.body}</p>
                    <small>
                      {note.author_name} · {date(note.created_at, true)}
                    </small>
                  </article>
                ))}
                <form className="note-form" onSubmit={addNote}>
                  <fieldset disabled={pending || closed}>
                    <label className="sr-only" htmlFor="note-body">
                      Ajouter une note interne
                    </label>
                    <textarea
                      id="note-body"
                      name="body"
                      placeholder="Ajouter un contexte utile à l’équipe…"
                      required
                      maxLength={4000}
                      rows={3}
                      onChange={() => {
                        noteRequest.current = null;
                      }}
                    />
                    <div>
                      <span>Visible uniquement par les membres autorisés.</span>
                      <button className="button" type="submit">
                        Ajouter la note
                      </button>
                    </div>
                  </fieldset>
                </form>
              </section>
            </>
          )}
          {tab === "documents" && (
            <section className="record-section">
              <h2>Pièces du dossier</h2>
              <p className="muted section-intro">
                État des pièces repris des scénarios. Le dépôt et l’ouverture
                des fichiers seront disponibles dans la prochaine étape.
              </p>
              {claim.documents.map((doc) => (
                <div key={doc.id} className="document-row">
                  <span className="document-icon">
                    <Icon name="file" />
                  </span>
                  <div>
                    <strong>{doc.label}</strong>
                    <small>
                      {doc.source === "-" ? "En attente du client" : doc.source}
                    </small>
                  </div>
                  <span className={`document-status doc-${doc.status}`}>
                    {documentLabels[doc.status] ?? doc.status}
                  </span>
                  {doc.storage_path && (
                    <a
                      className="button"
                      href={`/api/documents?path=${encodeURIComponent(doc.storage_path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir ↗
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}
          {tab === "activity" && (
            <section className="record-section">
              <h2>Historique du dossier</h2>
              <p className="muted section-intro">
                Les actions et leur auteur, dans l’ordre chronologique inverse.
              </p>
              <ol className="timeline">
                {[...claim.events]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )
                  .map((event) => (
                    <li key={event.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{event.label}</strong>
                        <p>
                          {event.actor_name}{" "}
                          <span>· {date(event.created_at, true)}</span>
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          )}
        </div>
        <aside className="record-rail">
          <div className="next-action-box">
            <div className="eyebrow">PROCHAINE ACTION</div>
            <h2>{nextAction(claim)}</h2>
            <p>
              {closed
                ? "Le dossier est archivé. Rouvrez-le pour reprendre son suivi."
                : claim.injury_state !== "none"
                  ? "Une blessure a été signalée. L’examen du dossier et les décisions restent humains."
                  : "Gardez une trace de votre prochaine démarche dans un suivi."}
            </p>
            {!closed && (
              <button
                className="button primary"
                onClick={() => {
                  setTab("summary");
                  setTimeout(() => taskInput.current?.focus(), 0);
                }}
              >
                Préparer un suivi <Icon name="arrow" size={15} />
              </button>
            )}
          </div>
          <div className="rail-section">
            <span className="eyebrow">RESPONSABLE</span>
            <div className="rail-person">
              <span className="avatar">
                {initials(
                  data.profiles.find((p) => p.id === claim.assigned_agent_id)
                    ?.full_name ?? "-",
                )}
              </span>
              <div>
                {data.profiles.find((p) => p.id === claim.assigned_agent_id)
                  ?.full_name ?? "Non attribué"}
                <small>Équipe automobile</small>
              </div>
            </div>
          </div>
          {items.length > 1 && (
            <div className="rail-section">
              <span className="eyebrow">AUTRES POINTS D’ATTENTION</span>
              <ul className="attention-list">
                {items.slice(1).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {claim.assistance_source && (
            <div className="rail-section">
              <span className="eyebrow">ASSISTANCE À VÉRIFIER</span>
              <p className="rail-copy">
                Contrat : {claim.contract.insurer}. Source assistance :{" "}
                {claim.assistance_source}.
              </p>
              <p className="rail-copy">
                {claim.assistance_source !== claim.contract.insurer
                  ? "Les sources diffèrent. Vérifiez auprès de l’assureur du contrat."
                  : "Vérifiez la garantie auprès de l’assureur."}{" "}
                Aucune prise en charge confirmée.
              </p>
            </div>
          )}
          <div className="rail-section rail-last">
            <Icon name="clock" size={15} />
            <span>
              Dernière activité
              <br />
              {date(claim.updated_at, true)}
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
