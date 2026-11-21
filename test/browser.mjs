import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { database, action, state, USER } from "./db-helper.js";
await mkdir("test/artifacts", { recursive: true });
const db = await database();
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  reducedMotion: "reduce",
});
const user = {
  id: USER,
  email: "learner@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const jwt = (b) => Buffer.from(JSON.stringify(b)).toString("base64url");
const token =
  jwt({ alg: "HS256", typ: "JWT" }) +
  "." +
  jwt({
    sub: USER,
    email: user.email,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }) +
  ".testsignature";
await context.route(
  "https://qgjqxixvmwkmubdunkfv.supabase.co/**",
  async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    let body = {};
    let status = 200;
    try {
      if (url.pathname === "/auth/v1/token")
        body = {
          access_token: token,
          refresh_token: "test-only",
          expires_in: 3600,
          token_type: "bearer",
          user,
        };
      else if (url.pathname === "/auth/v1/user") body = user;
      else if (url.pathname === "/auth/v1/logout") body = {};
      else if (url.pathname.endsWith("/tutor_state")) body = await state(db);
      else if (url.pathname.endsWith("/tutor_action")) {
        const p = req.postDataJSON();
        body = await action(db, p.p_lesson, p.p_action, p.p_payload);
      } else throw Error("Unexpected test request " + url.pathname);
    } catch (e) {
      status = 400;
      body = { message: e.message };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    });
  },
);
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:4173");
  await page.getByLabel("Email", { exact: true }).fill("learner@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Enter your classroom" }).click();
  await page
    .getByRole("heading", { name: "Look before you copy", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".chosen")?.textContent === "Challenge",
  );
  await page.screenshot({ path: "test/artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test/artifacts/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.locator('[data-square="d1"]').click();
  await page.locator('[data-square="g4"]').click();
  await page.getByText("Position solved", { exact: true }).waitFor();
  assert.equal((await state(db)).xp, 20);
  await page
    .getByRole("button", { name: "Explain your choice", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Check threats and available captures" })
    .click();
  await page.getByText("Lesson complete", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Look before you copy", exact: true })
    .waitFor();
  assert.equal((await state(db)).xp, 20);
  assert.ok((await state(db)).progress["look-before-copy"].completed);
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await page.locator('[data-square="d1"]').click();
  await page.locator('[data-square="g4"]').click();
  await page.getByText("Position solved", { exact: true }).waitFor();
  assert.equal((await state(db)).xp, 20);
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await page.getByRole("button", { name: "View source", exact: false }).click();
  await page.locator("dialog").waitFor();
  await page.getByRole("button", { name: "Close source" }).click();
  await page.getByRole("button", { name: "Watch the story" }).click();
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await page.getByText("Replay · 1 / 6 half-moves").waitFor();
  await page.getByRole("button", { name: "Try the position" }).click();
  await page.getByLabel("Ask your coach").fill("What is the centre?");
  await page.getByRole("button", { name: "Send message" }).click();
  await page
    .getByText("The four central squares are d4, e4, d5 and e5.", {
      exact: false,
    })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open lessons" }).click();
  await page
    .getByRole("button", { name: "Make room in the centre", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Make room in the centre" })
    .waitFor();
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.locator('[data-square="a2"]').click();
  await page.locator('[data-square="a3"]').click();
  await page.getByText("−5 XP · new missed attempt").waitFor();
  assert.equal((await state(db)).xp, 15);
  await page.getByRole("button", { name: "Hint · solve for +10 XP" }).click();
  await page
    .getByText("Choose the d-pawn or e-pawn.", { exact: true })
    .waitFor();
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  await page.getByText("Position solved", { exact: true }).waitFor();
  assert.equal((await state(db)).xp, 25);
  await page.getByRole("button", { name: "Open lessons" }).click();
  await page
    .getByRole("button", { name: "Look before you copy", exact: true })
    .click();
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await page.screenshot({
    path: "test/artifacts/mobile-replay.png",
    fullPage: true,
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `horizontal overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open lessons" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Enter your classroom" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: login, legal board interaction, challenge rewards, reflection, persisted reload, replay protection, source dialog, story replay, coaching, mobile navigation, hints, penalties, responsive widths, logout; no page errors. Supabase HTTP was simulated; the actual migration ran on local PGlite Postgres.",
  );
} finally {
  await browser.close();
  await db.close();
}
