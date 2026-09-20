import { expect, test } from "@playwright/test";

test("demo home, filtered queue and keyboard preview", async ({ page }) => {
  const errors: string[] = [];
  const searchRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/demo/sinistres" && url.searchParams.has("q"))
      searchRequests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Bonjour Leïla." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Voir les sinistres" }).click();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("textbox", { name: "Rechercher un sinistre" })
    .pressSequentially("Nadia");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page).toHaveURL(/q=Nadia/);
  const row = page.getByRole("button", { name: /Nadia El Mansouri/ });
  await row.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: "Demander : constat amiable" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(row).toBeFocused();
  await row.click();
  await drawer.getByRole("link", { name: "Ouvrir le dossier complet" }).click();
  await expect(
    page.getByRole("heading", { name: "Nadia El Mansouri", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(searchRequests).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("demo note, follow-up, independent undo and reset", async ({ page }) => {
  await page.goto("/demo/sinistres/SIN-26091");
  await page
    .getByLabel("Ajouter une note interne")
    .fill("Client rappelé, constat attendu demain.");
  await page.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(
    page.getByText("Client rappelé, constat attendu demain.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Prochain suivi").fill("Rappeler Nadia demain");
  await page.getByLabel("Échéance", { exact: true }).fill("2026-09-20");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Terminer : Rappeler Nadia demain",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Terminer : Demander le constat amiable",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Annuler", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", {
      name: "Terminer : Rappeler Nadia demain",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Rouvrir : Demander le constat amiable",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activité", exact: true }).click();
  await expect(
    page.getByText("Note interne ajoutée", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Client rappelé, constat attendu demain.", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Terminer : Demander le constat amiable",
      exact: true,
    }),
  ).toBeVisible();
});

test("Arabic source and attention remain explicit", async ({ page }) => {
  await page.goto("/demo/sinistres/SIN-26095");
  await expect(page.locator('[lang="ar"][dir="rtl"]')).toContainText("اصطدمت");
  await expect(
    page.getByText("Traduction de travail · français · à valider"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Statut du dossier", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Revue humaine · blessure signalée" }),
  ).toBeVisible();
  await page.goto("/demo/sinistres/SIN-26094");
  await expect(
    page.getByText("Contrat : RMA. Source assistance : Sanlam Maroc."),
  ).toBeVisible();
});

test("protected routes require a session", async ({ page }) => {
  await page.goto("/sinistres/SIN-26091");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Nadia El Mansouri")).not.toBeVisible();
});

test("authenticated notes, status, task and audit survive reload", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.TEST_LOCAL_SUPABASE !== "1" ||
      testInfo.project.name !== "desktop",
    "Local seeded Supabase required",
  );
  await page.goto("/login");
  await page
    .getByLabel("Adresse e-mail")
    .fill("yasmine@demo.med-assurance.test");
  await page.getByLabel("Mot de passe").fill("Demo-local-2026!");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await page.getByRole("link", { name: "Voir les sinistres" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.goto("/sinistres/SIN-26091");
  const note = `Suivi navigateur ${Date.now()}`;
  await page.getByLabel("Ajouter une note interne").fill(note);
  await page.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await page
    .getByLabel("Statut du dossier", { exact: true })
    .selectOption("en_cours");
  await expect(
    page.getByText("Modification enregistrée", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Statut du dossier", { exact: true }),
  ).toHaveValue("en_cours");
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await page.getByLabel("Prochain suivi").fill(note);
  await page.getByLabel("Échéance", { exact: true }).fill("2026-09-21");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Terminer : ${note}`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Terminer : ${note}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Rouvrir : ${note}`, exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: `Rouvrir : ${note}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activité", exact: true }).click();
  await expect(
    page.getByText(`Suivi terminé : ${note}`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vue d’ensemble", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Rouvrir : ${note}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Terminer : ${note}`, exact: true }),
  ).toBeEnabled();
  // Simulate an unavailable network, then verify the optimistic task rolls back.
  await page.route("**/sinistres/SIN-26091", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page
    .getByRole("button", { name: `Terminer : ${note}`, exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Connexion interrompue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Terminer : ${note}`, exact: true }),
  ).toBeVisible();
  await page.unroute("**/sinistres/SIN-26091");
  await page
    .getByLabel("Statut du dossier", { exact: true })
    .selectOption("en_attente_client");
  await expect(
    page.getByText("Modification enregistrée", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/sinistres");
  await expect(page).toHaveURL(/\/login$/);
});
