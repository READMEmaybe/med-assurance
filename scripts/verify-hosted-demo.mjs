import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";

nextEnv.loadEnvConfig(process.cwd(), true);
const credentials = JSON.parse(
  readFileSync(".env.hosted-accounts.json", "utf8"),
);
assert.equal(credentials.projectRef, "jrfmolrxiuxmnunauukz");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, credentials.url);
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client = () =>
  createClient(credentials.url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
for (const account of credentials.accounts) {
  const db = client();
  const { error } = await db.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  assert.equal(error, null, `Hosted login: ${account.role}`);
  const result = await db.from("claims").select("reference");
  assert.equal(result.error, null);
  const expected =
    account.role === "client"
      ? 0
      : account.role !== "agent"
        ? 6
        : account.email.startsWith("imane@")
          ? 1
          : 2;
  assert.equal(
    result.data.length,
    expected,
    `Scoped claims: ${account.full_name}`,
  );
  assert.ok(
    (await db.from("profiles").update({ role: "admin" }).eq("id", account.id))
      .error,
    "Direct profile changes denied",
  );
  if (account.role === "client") {
    for (const table of ["notes", "activity_events", "tasks", "documents"]) {
      const internal = await db.from(table).select("*");
      assert.equal(internal.error, null);
      assert.deepEqual(internal.data, []);
    }
  }
  await db.auth.signOut();
}
assert.ok(
  (await client().from("claims").select("*")).error,
  "Anonymous table requests denied",
);

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  if (process.env.VERCEL_COOKIE_JAR) {
    const cookies = readFileSync(process.env.VERCEL_COOKIE_JAR, "utf8")
      .split("\n")
      .filter(
        (line) =>
          line.includes("\t") &&
          (!line.startsWith("#") || line.startsWith("#HttpOnly_")),
      )
      .map((line) => {
        const [rawDomain, , path, secure, expiry, name, value] =
          line.split("\t");
        return {
          domain: rawDomain.replace("#HttpOnly_", ""),
          path,
          secure: secure === "TRUE",
          httpOnly: rawDomain.startsWith("#HttpOnly_"),
          expires: Number(expiry) || -1,
          name,
          value,
          sameSite: "Lax",
        };
      });
    await context.addCookies(cookies);
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const account = credentials.accounts.find((a) => a.role === "supervisor");
  const base = new URL(credentials.loginUrl).origin;
  await page.goto(credentials.loginUrl);
  await page.getByLabel("Adresse e-mail").fill(account.email);
  await page.getByLabel("Mot de passe").fill(account.password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL(`${base}/accueil`);
  await expect(
    page.getByRole("heading", { name: "Bonjour Leïla." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voir les sinistres" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.goto(`${base}/sinistres/SIN-26091`);
  const note = `Connexion et enregistrement vérifiés sur le site hébergé (${new Date().toISOString()}).`;
  const task = `Vérification du suivi hébergé · ${Date.now()}`;
  await page.getByLabel("Ajouter une note interne").fill(note);
  await page.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await page.getByLabel("Prochain suivi").fill(task);
  await page
    .getByLabel("Échéance", { exact: true })
    .fill(new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByRole("button", { name: `Terminer : ${task}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Rouvrir : ${task}`, exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Terminer : ${task}`, exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: `Terminer : ${task}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Rouvrir : ${task}`, exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: `Rouvrir : ${task}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activité", exact: true }).click();
  await expect(
    page.getByText(`Suivi terminé : ${task}`, { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText(`Suivi rouvert : ${task}`, { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/hosted-audit.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.waitForURL(`${base}/login`);
  await page.goto(`${base}/sinistres`);
  await page.waitForURL(`${base}/login`);
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "Hosted verification passed: six account logins, record scope, direct-write rejection, browser login/logout, note/task persistence, undo and matching audit.",
  );
} finally {
  await browser.close();
}
