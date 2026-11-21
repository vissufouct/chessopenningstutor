# Enable the in-app OpenAI coach

The website never receives the OpenAI API key. Authenticated requests go through the `chess-coach` Supabase Edge Function, which checks the existing single-learner allowlist, validates board positions using chess.js, enforces a database quota, then calls the OpenAI Responses API. The ChatGPT subscription handoff remains available.

## 1. Use a fresh API key

If a key was pasted into chat, revoke it in the OpenAI API dashboard and create a replacement. Do not paste the replacement into conversation, source files, GitHub settings for frontend builds, or the browser.

In your Supabase project's **Edge Functions → Secrets**, add:

- `OPENAI_API_KEY`: the replacement key, entered directly into the secret field.
- Optional `OPENAI_MODEL`: defaults to `gpt-4.1-mini`.
- Optional `ALLOWED_ORIGINS`: defaults to `https://vissufouct.github.io`. Comma-separated full origins only; add a local development origin only when needed. Never use `*`.

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. Do not copy their values into the app. No service-role key is requested from the learner.

API billing is separate from ChatGPT subscriptions. No automatic purchase or plan upgrade is part of this setup. Ensure the API project has access to the selected model. The app enforces 5 calls per minute and 60 per rolling 24 hours per learner, max 650 output tokens per call, bounded questions/history and a fixed server-side model. These are usage limits, not a guarantee of a fixed dollar cost. OpenAI project budget alerts may not be hard spending caps.

## 2. Run the additive migration

In **SQL Editor → New query**, run `supabase/003_ai_coach.sql` (or the exported `first-moves-ai-setup.sql`). It preserves all accounts, lessons and XP. It adds two guarded functions and a minimal usage table. Old usage rows are pruned during requests; prompts and replies are not stored there.

## 3. Deploy the function

Dashboard route:

1. Run `node scripts/export-coach-setup.js` locally to create `/workspace/first-moves-ai-coach.ts` and `/workspace/first-moves-ai-setup.sql`.
2. In **Edge Functions**, create a function named **chess-coach** using the editor.
3. Replace its code with the entire dashboard-ready `first-moves-ai-coach.ts`, then deploy.
4. Turn off the function gateway's legacy **Verify JWT** setting. This is required for projects using newer signing keys. Authentication remains enforced inside the function: it validates the bearer session with Supabase Auth and checks the single-learner allowlist before any model call.

CLI alternative, when your machine has authorized Supabase CLI access:

```sh
supabase functions deploy chess-coach --project-ref qgjqxixvmwkmubdunkfv --no-verify-jwt
```

Use the dashboard to enter the replacement API secret. Never put its value on a command line or in committed files.

## 4. Check the live app

After GitHub Pages deploys the frontend, sign in and choose **In-app AI coach**. Ask about the visible position, make an exploratory move, and ask a follow-up. Replies should appear in the app and refer to the position sent. During an unfinished challenge, a successful AI answer records hint use and reduces the solve reward to +10 XP. Practice is unscored.

If the backend is not installed or no key is configured, the app shows an explicit error and preserves your draft for retry. The subscription handoff, lessons and explorations remain usable. No automatic model retries incur extra calls. Failed upstream attempts count against the request quota.

The model is not a chess engine. Legal moves and board facts are supplied to it, but its explanations can still be wrong; suggested moves are never executed automatically. Conversations stay in browser memory for the current lesson and clear on reload or when starting a new conversation. The last eight AI messages and their position snapshots are sent on follow-up questions. No app password or session token is included in model context. OpenAI requests use `store:false`; this does not promise exemption from provider abuse-monitoring retention.

## Local verification

`npm test` exercises the actual handler with mocked HTTP services, including authorization, wrong origins, invalid positions, context/history, missing configuration, quotas, sanitized upstream errors, and SQL role restrictions. Browser tests exercise in-app replies, follow-ups, snapshot accuracy, retryable errors and the existing subscription fallback. These tests do not establish that a live OpenAI key or deployed Edge Function works.
