# FAMMS — Factory Asset & Maintenance Management System

Equipment maintenance management for three Indonesian factories (SJA, DIN,
Olentia): machine master + QR codes, multi-action incident workflow, repeat-
failure detection via a standardized fault tree, PM scheduling, KPI dashboard,
knowledge base, Telegram notifications.

verified: 2026-07-04

**Rewritten 2026-07-04.** The previous CLAUDE.md contained another project's
docs and stale status; it was deleted at the user's request. If you
ever need it: `git show 635a4b7:CLAUDE.md`. Do not trust its contents.

## Ground rules (read before touching anything)

1. **Code is truth, docs are hints.** Before acting on any claim about what
   exists (files, tables, features), confirm with Glob/Grep/Read. If a doc
   contradicts the code, the code wins — then fix the doc per
   `docs/agents/MAINTENANCE.md`.
2. **Delegate bulk work.** Before any repo-wide scan, reading >5 files, web
   research, or batch edits, read `docs/agents/DELEGATION.md` and dispatch a
   subagent. Only conclusions belong in the main conversation.
3. **Reply to the user in Traditional Chinese (繁體中文).** The user writes
   zh-TW. Code, commits, and identifiers stay in English.
4. **Next.js 16 differs from your training data.** Read the relevant guide in
   `node_modules/next/dist/docs/` before writing framework-touching code
   (see `AGENTS.md`). Fresh containers have no `node_modules` — run
   `npm install` first; if the docs dir is still absent, say so instead of
   writing from training-data memory.

## Commands

```bash
npm install          # run FIRST in a fresh container (node_modules is not checked in)
npm run dev          # http://localhost:3000
npx tsc --noEmit     # type check — MUST exit 0 before every commit
npm run lint         # eslint
npm run build        # CI runs tsc + build (.github/workflows/ci.yml)
```

There are no automated tests. Repo lives at `/home/user/FAMMS` in remote
sessions. Supabase env vars go in `.env.local` (never commit it).

## Hard constraints (violating these breaks the app)

- **Base UI, NOT Radix.** `src/components/ui/*` wraps `@base-ui/react`.
  There is **no `asChild` prop**. Use styled `<Link className=...>` or
  `onClick={() => router.push(...)}`. (Some `@radix-ui/*` packages remain in
  package.json as leftovers — do not import them in new code.)
- **Trilingual UI.** All user-facing strings go through `t('key')` from
  `src/lib/i18n/`; every new key must be added to **all three** files:
  `src/lib/i18n/locales/{zh,en,id}.json`. Default locale is `id`. Technical
  part names (bearing, VFD, PLC…) stay English in every locale.
- **SQL migrations are the highest-risk artifact** — they run against the
  production Supabase. Every schema change is a NEW idempotent file
  `supabase/migration_<topic>.sql` (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`;
  safe to re-run). The user pastes file contents into the Supabase SQL Editor
  by hand — see `supabase/README.md` (Chinese) for their runbook. **Never hand
  the user a migration that hasn't passed a fresh-context review**
  (`docs/agents/DELEGATION.md` §6).
- **Roles & permissions:** `UserRole` = technician | supervisor | manager |
  director | admin (`src/types/famms.ts`); permission checks live in
  `src/lib/permissions.ts`. Don't invent new roles ad hoc.

## Domain model (pointers, not copies)

- Types + label maps (statuses, roles, actions): `src/types/famms.ts`
- Incident flow: reported → accepted → analyzing → (waiting_parts) → repair →
  testing → observation → closed. Multi-action, not one-step; temporary vs
  permanent fix matters for repeat-failure detection (same machine + same
  failure code + ≤30 days + prior temp fix ⇒ flag, supervisor confirms).
- Fault tree (100+ codes): `FAMMS_FAULT_TREE.md`, seed in
  `supabase/seed_fault_tree.sql`
- KPI / health score logic: `src/lib/kpi.ts`, `src/lib/health-score.ts`
- RCA trigger (same failure code ≥3× in 90 days): `src/lib/rca.ts`
- Telegram notifications: `src/lib/telegram.ts`, `src/app/api/notifications/`
- DB setup order & migration list: `supabase/README.md`
- Manual E2E checklist: `docs/E2E_CHECKLIST.md`

## Routing — read the matching file BEFORE starting

| Situation | Read |
|---|---|
| Any task needing >5 file reads, a scan, research, or batch edits | `docs/agents/DELEGATION.md` |
| Delegating? Copy the matching prompt template | `docs/agents/TEMPLATES.md` |
| Unsure: escalate model? done? ask user? change approach? | `docs/agents/JUDGMENT.md` |
| Editing CLAUDE.md or anything in `docs/agents/` | `docs/agents/MAINTENANCE.md` |
| Session start in a fresh container / after long gap | `docs/agents/LETTER.md` |
| Why these rules exist (evidence) | `docs/agents/DIAGNOSIS.md` |
| Touching DB / writing SQL | `supabase/README.md` |

## Definition of done (short form; full rubric in JUDGMENT.md)

A change is done when: `npx tsc --noEmit` exits 0 · new UI strings exist in all
3 locales · new SQL is idempotent and fresh-context-reviewed · the affected flow
was exercised (or you told the user explicitly what you could not verify and
why) · work is committed and pushed to the designated branch. Sessions are
ephemeral — **unpushed work is lost work**.
