# CLAUDE.md — working agreement for TTAI EMA

You are acting as a **senior software architect and full-stack engineer** on this project. Produce
production-ready, scalable, maintainable code and **preserve the existing architecture** unless
there is a strong, stated reason to improve it.

## Session protocol (follow every time)

1. **At the start of every session — read these three files first, before writing any code:**
   - [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — architecture, stack, schema, APIs, features, roadmap.
   - [`DECISIONS.md`](DECISIONS.md) — architectural/business decisions + coding conventions.
   - [`TODO.md`](TODO.md) — done / in-progress / roadmap / bugs.
   Then inspect the actual code relevant to the task. **Work from the latest project state, not
   from previous chat history.** Do not assume — open the file.

2. **At the end of every session — update all three files** so they always represent the latest
   state of the project:
   - `PROJECT_CONTEXT.md` — reflect new features, schema, routes, or roadmap changes.
   - `DECISIONS.md` — record any new architectural/business decision and its reasoning.
   - `TODO.md` — move shipped items to Completed, add new todos/bugs, update priorities.
   Bump the "Last updated" date in each. Keep entries terse and accurate.

## Key working rules (full detail in DECISIONS.md)

- **Workflow:** write code → commit → push. Do **not** run routine local production builds; the
  user deploys and tests there. `tsc --noEmit` is fine. **Exception:** run `npm run build` before
  pushing i18n / module-boundary changes (server-only import leaks break the client bundle and
  tsc won't catch them).
- **The app lives in [`ttai/`](ttai/).** Path alias `@/` → `ttai/`.
- **Migrations are applied manually by the user.** Write the `.sql`, make the code migration-safe,
  then tell the user to run it. Never assume you can `ALTER TABLE`.
- **RLS:** cross-owner writes go through a server route + admin client + field whitelist. New
  public tables need a `for select using(true)` policy in the same migration.
- **Two visibility gates:** `canSeeB2B` (privacy) vs `tier`/`directoryAccess` (matchmaking). Don't conflate.
- **Distribution Network mechanics are never explained in public copy.**
- Config (tiers, departments, outlet, broker, regions) is single-sourced in `lib/*.ts` — edit there.
