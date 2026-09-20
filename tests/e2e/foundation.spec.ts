import { expect, test } from "@playwright/test";

test("public foundation navigates across separate surfaces", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Un suivi clair.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /Espace courtier/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Heureux de vous retrouver",
  );
  await page.getByRole("link", { name: "Retour à l’accueil" }).click();
  await page.getByRole("link", { name: /Espace client/ }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "La route continue",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("keyboard skip link and missing route work", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Aller au contenu" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenu$/);
  const response = await page.goto("/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
});

test("liveness contains no credentials", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({
    status: "ok",
    application: "med-assurance",
  });
});
