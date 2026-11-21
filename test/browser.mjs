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
  permissions: ["clipboard-read", "clipboard-write"],
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
  await page.locator("dialog[open]").waitFor();
  await page.getByRole("button", { name: "Close source" }).click();
  await page.getByRole("button", { name: "Lesson summary" }).click();
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await page.getByText("Step 1 of 7 · 1. d3").waitFor();
  await page
    .locator(".move-reason")
    .filter({ hasText: "White opens the diagonal for the c1-bishop" })
    .waitFor();
  assert.match(
    await page.locator('[data-square="d3"]').getAttribute("aria-label"),
    /White pawn/,
  );
  await page
    .getByRole("button", { name: "Previous move", exact: true })
    .click();
  assert.match(
    await page.locator('[data-square="d2"]').getAttribute("aria-label"),
    /White pawn/,
  );
  await page
    .getByRole("button", { name: "Last position", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "4. Qxg4 · White", exact: true })
    .waitFor();
  assert.match(
    await page.locator('[data-square="g4"]').getAttribute("aria-label"),
    /White queen/,
  );
  await page
    .getByRole("button", { name: "Previous move", exact: true })
    .click();
  await page.getByLabel("Autoplay pace").selectOption("1500");
  await page
    .getByRole("button", { name: "Play walkthrough", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "4. Qxg4 · White", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Play walkthrough", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "1… d5", exact: true }).click();
  await page
    .getByRole("heading", { name: "1… d5 · Black", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Play walkthrough", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pause walkthrough", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "1… d5 · Black", exact: true })
    .waitFor();
  await page.screenshot({
    path: "test/artifacts/walkthrough-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Lesson summary", exact: true })
    .waitFor({ state: "visible" });
  await page.locator(".phone-move-note").waitFor({ state: "visible" });
  await page.screenshot({
    path: "test/artifacts/walkthrough-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1024 });
  assert.equal((await state(db)).xp, 20);
  await page.getByRole("button", { name: "Try the position" }).click();
  assert.match(
    await page.locator('[data-square="g4"]').getAttribute("aria-label"),
    /Black bishop/,
  );
  // A missed legal move remains on the board and can be followed by a reply.
  await page.locator('[data-square="d4"]').click();
  await page.locator('[data-square="e5"]').click();
  await page.getByRole("heading", { name: "What happens next?" }).waitFor();
  assert.match(
    await page.locator('[data-square="e5"]').getAttribute("aria-label"),
    /White pawn/,
  );
  await page.locator('[data-square="f8"]').click();
  await page.locator('[data-square="b4"]').click();
  await page.getByText("White to move · in check", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "What happens next?" }).waitFor();
  await page.getByLabel("Question for ChatGPT").fill("What did I overlook?");
  await page
    .getByRole("button", { name: "Discuss board in ChatGPT", exact: true })
    .click();
  const snapshot = await page
    .getByLabel("Board context for ChatGPT")
    .inputValue();
  assert.ok(snapshot.includes("dxe5 Bb4+"));
  assert.ok(snapshot.includes("What did I overlook?"));
  assert.ok(snapshot.includes("Current FEN:"));
  await page
    .getByRole("button", { name: "1. Copy position", exact: true })
    .click();
  await page.getByRole("button", { name: "Copied!", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "2. Open ChatGPT" })
      .getAttribute("href"),
    "https://chatgpt.com/",
  );
  await page.getByRole("button", { name: "Close ChatGPT handoff" }).click();
  await page.screenshot({
    path: "test/artifacts/exploration-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test/artifacts/exploration-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Undo last move" }).click();
  await page.getByText("Black to move", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Return to exercise", exact: true })
    .click();
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
  await page.getByRole("heading", { name: "What happens next?" }).waitFor();
  assert.equal((await state(db)).xp, 15);
  await page
    .getByRole("button", { name: "Return to exercise", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Discuss board in ChatGPT", exact: true })
    .click();
  await page
    .getByText("Using outside coaching on this challenge counts as a hint:", {
      exact: false,
    })
    .waitFor();
  await page.getByRole("button", { name: "1. Copy position" }).click();
  await page.getByRole("button", { name: "Copied!", exact: true }).waitFor();
  assert.ok((await state(db)).progress["central-start"].hinted);
  await page.getByRole("button", { name: "Close ChatGPT handoff" }).click();
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
  await page.evaluate(
    ({ id }) =>
      localStorage.setItem(
        `first-moves:exploration:${id}:look-before-copy`,
        JSON.stringify({ anchor: "7k/P7/8/8/8/8/8/7K w - - 0 1", moves: [] }),
      ),
    { id: USER },
  );
  await page.reload();
  await page.getByRole("heading", { name: "What happens next?" }).waitFor();
  await page.locator('[data-square="a7"]').click();
  await page.locator('[data-square="a8"]').click();
  await page.getByRole("button", { name: "Promote to knight" }).click();
  assert.match(
    await page.locator('[data-square="a8"]').getAttribute("aria-label"),
    /White knight/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open lessons" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Enter your classroom" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: login, legal board interaction, challenge rewards, reflection, persisted reload, replay protection, source dialog, annotated walkthroughs, backwards/forwards, autoplay/pause, move jumping, persistent exploration, undo, underpromotion, ChatGPT snapshot handoff, mobile navigation, hints, penalties, responsive widths, logout; no page errors. Supabase HTTP was simulated; the actual migration ran on local PGlite Postgres.",
  );
} finally {
  await browser.close();
  await db.close();
}
