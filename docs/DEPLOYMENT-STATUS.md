# Deployment status

- App implementation: built, responsive, 12 lessons within chapters 1–2.
- Local PostgreSQL-compatible tests: passed (PGlite runs the real SQL migrations).
- Local Chromium browser tests: passed against the SQL-backed Supabase mock.
- Supabase project: public URL/key configured from the user's supplied settings.
- Live Supabase: not verified; execution environment outbound proxy returns 403.
- Schema/learner setup: prepared as SQL; remote installation and Auth account creation need confirmation.
- GitHub API: request blocked by outbound proxy (403).
- Initial GitHub Pages release: user confirmed the deployed site works.
- Latest exploration/ChatGPT handoff revision: locally tested; deployment uses the existing main-branch Pages workflow.
- No database migration, API key, model charge or paid add-on is required for this revision.
- Free-plan status: user confirms their project is Free; billing dashboard cannot be inspected here. No paid resources requested or created.

Do not treat a local pass as evidence that the remote deployment, credentials or cross-device sync work.
