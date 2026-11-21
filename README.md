# First Moves

A responsive, single-learner chess classroom for the ideas in chapters 1–2 of Yasser Seirawan’s *Winning Chess Openings*. Twelve lessons combine original teaching summaries, legal chessboard interaction, replayable examples, hints, reflection questions, and challenge XP. The coach is a transparent, rule-based lesson companion, not an LLM. No AI API key is required.

## Run locally

Requires Node.js 24 or newer.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

The public Supabase project URL and publishable key are in `src/config.json`. These are browser-safe identifiers, not administrative credentials. Optional overrides: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in ignored `.env.local`. Never put service-role keys, database passwords or learner passwords in frontend code, repository files, or GitHub Pages.

## Database and account setup

Use an existing **Supabase Free organization and Free project**. No paid feature, add-on, Edge Function or external AI service is required. We cannot read or guarantee account billing settings; check the organization's Billing/Subscription page before proceeding. Free quotas and inactivity pausing still apply. Do not upgrade to a paid plan to complete these instructions.

In the project's SQL editor, run in order:

1. `supabase/001_schema.sql`
2. `supabase/002_course.sql`
3. Set the one permitted learner email:

```sql
insert into public.tutor_settings(singleton,allowed_email)
values (true, 'YOUR_LEARNER_EMAIL')
on conflict(singleton) do update set allowed_email=excluded.allowed_email;
```

In **Authentication → Users**, add the requested learner with their chosen password. Use the dashboard's secure password field, not a SQL file. Confirm the email using the supported dashboard or email-confirmation flow. If the user already exists, reuse it instead of creating a duplicate. Then disable public sign-ups under Authentication settings. The app also checks the allowed email on every database operation; other authenticated accounts cannot use the course data.

Set the Auth Site URL to the actual deployed GitHub Pages URL. Email recovery is not exposed in this first single-user release; the project owner can manage recovery from Supabase.

The migrations are rerunnable and preserve progress. `001_schema.sql` installs row-level security and revokes direct table access from browser roles. Security-definer RPC functions enforce the single allowed account, legal exercise moves, hints, XP, and reflection completion. Per-user row locks prevent duplicate awards. Changing the project to another Supabase instance requires rerunning database setup and changing public config.

## GitHub Pages

The checked-in workflow builds and deploys when `main` changes. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. GitHub Free Pages requires a public repository. Do not make a private repository public without the owner's explicit approval.

No repository secret is required for the publishable key. The application has no client router, so refreshes do not need a Pages rewrite rule. The build base is `/chessopenningstutor/` in GitHub Actions. If the repository is renamed or a custom domain is used, update `vite.config.js`.

Expected project URL (not proof of a successful deployment): `https://vissufouct.github.io/chessopenningstutor/`.

Only `dist/client` is uploaded to Pages. SQL migrations, database data, uploaded book PDF, passwords and local test artifacts are not published in the website artifact. The source repository contains exercise answers, as most open-source learning tools do; the database still owns all scoring. XP is motivational progress, not an anti-cheat competition or a chess rating.

## Validation

```sh
npm test
npm run build
# With the dev server running and Chromium installed:
npm run test:browser
```

Database tests run the real SQL migrations in PGlite (local PostgreSQL), including anonymous/wrong-account denial, denied direct writes, all solution paths, hint discounts, duplicate rewards, negative XP bounds and reflection. Browser tests run Chromium with Supabase HTTP responses backed by that database. This validates the UI and database contract, **not live Supabase Auth, real network delivery or cross-device persistence**. Those require a separately completed live deployment smoke test.

## Course maintenance

`lessons.js` is the source of truth. Run `npm run course:generate` after editing. It checks move legality and generates public course content plus private server exercise transitions. Do not overwrite the database migration manually. Chapter 2's castling position and several principle exercises are original practice positions, distinguished from the book's illustrative games.

XP: +20 for a first challenge solve, +10 after any saved hint, up to −5 for a distinct missed legal challenge move before its first award. No practice penalties. XP cannot fall below zero; levels use peak XP and stay earned. Each lesson pays only once. Reflection completes the lesson. Replaying never deletes history.

## Privacy and persistence

Supabase Auth handles passwords. The app stores lesson progress, XP, completion and the last coaching response in the learner's Supabase project; session tokens are stored by the Supabase browser SDK. The current conversation is kept in memory and clears when changing lessons or reloading. Export downloads progress locally. No analytics, ads, external AI calls or publicly served personal data are included.

See `docs/CONTENT.md` and `public/pieces/ATTRIBUTION.md` for source mapping and asset credits.
