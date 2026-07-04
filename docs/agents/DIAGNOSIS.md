# Harness Diagnosis — 2026-07-04 (written by Fable 5)

verified: 2026-07-04

Top three ways this environment wastes tokens, loses focus, or produces errors.
Every other doc in `docs/agents/` exists to fix one of these. Evidence was
verified against the repo on 2026-07-04; re-verify before citing it as current.

---

## #1 — CLAUDE.md was contaminated and stale (worst token leak + worst error source)

**Evidence (as of commit 635a4b7):**
- The old CLAUDE.md (~26 KB; deleted at the user's request, recoverable via
  `git show 635a4b7:CLAUDE.md`)
  contained the **full documentation of a different project** — a purchase-request
  approval system ("pdp": `purchase_requests`, `vendors`, approval thresholds,
  `D:\Projects\pdp\`) — appended after the FAMMS docs, with duplicate
  "Tech Stack", "Environment Variables", and "File Map" sections.
- It stated wrong facts as current: "Project Location: /home/user/project"
  (actual: `/home/user/FAMMS`), "Not Yet Built: PM module, Knowledge Base, KPI
  charts, health score, QR codes" (all exist in `src/`), "UI is Bahasa Indonesia"
  (app is trilingual zh/en/id via `src/lib/i18n/`).
- Its file map listed components that do not exist (`ActionForm.tsx`,
  `RCAForm.tsx`, `BlockingForm.tsx`, `PMCalendar.tsx`) and omitted ones that do
  (`IncidentBoard.tsx`, `permissions.ts`, `i18n/`).

**Why it hurts:** every session paid ~7k tokens to load it, and roughly half of
what a weaker model "learned" from it was false. A model that trusts a wrong
file map edits phantom files, re-implements existing features, or reasons about
another project's database schema.

**Fix (done + standing rule):**
- CLAUDE.md rewritten in this session as a thin, accurate router (~100 lines);
  the old file was deleted entirely at the user's request (git history keeps it).
- Standing rule now in CLAUDE.md: **code is truth, docs are hints** — before
  acting on any doc claim about what exists, confirm with Glob/Grep/Read.
- Standing rule: status claims in docs must carry a `verified: YYYY-MM-DD` date;
  update-or-delete protocol is in `docs/agents/MAINTENANCE.md`.

---

## #2 — No delegation infrastructure: the main context does grunt work until it drowns

**Evidence:**
- Before this session the repo had no `.claude/` directory at all: no subagent
  definitions, no settings, no dispatch rules.
- Past sessions did repo-wide work inline. Example: the RLS Phase 2 saga
  (commits `e0e761a` → `a8cb35a` → `083240d`) required auditing every table and
  policy across `supabase/*.sql` — exactly the kind of bulk reading that fills
  the main context, triggers compaction/summarization, and makes the model lose
  the thread mid-task. Focus loss after compaction is where weaker models fail
  hardest: they forget constraints stated early (e.g. "Base UI has no asChild")
  and re-break them.

**Why it hurts:** raw file dumps in the main conversation are pure token leak —
the model needs the *conclusion* ("policy X references nonexistent column Y at
migration_rls_phase2.sql:120"), not 500 lines of SQL in its history. Each
compaction cycle also risks silently dropping the user's original acceptance
criteria.

**Fix (done):**
- `docs/agents/DELEGATION.md` — the commander-does-not-fight rule: bulk
  reads, repo scans, web research, and batch edits go to subagents; only
  conclusions enter the main conversation.
- Predefined agents in `.claude/agents/` (scout / implementer / verifier /
  reviewer) with pinned `model:` and `effort:` so a weak main model doesn't have
  to remember dispatch parameters.
- Report contract: subagents return conclusions + `file:line` refs only; long
  output goes to a file, the path is returned.

---

## #3 — No verification loop: work was self-graded and shipped unverified

**Evidence:**
- Git log shows fix-of-fix chains on the same artifact: three consecutive
  corrective commits on the RLS Phase 2 migration ("add missing ON clauses" →
  "move helper functions" → "fix nonexistent columns, lockout bug"). Each
  round-trip = user pastes SQL into Supabase, hits an error, comes back. User
  round-trips are the most expensive failure mode this environment has.
- No automated tests exist (`package.json` has no test script); CI only runs
  `npx tsc --noEmit` + `npm run build`. SQL migrations — the highest-risk
  artifact in this project, since they run against the production Supabase —
  had no review gate at all.
- The old CLAUDE.md asserted "TypeScript: 0 errors" as a static fact instead of
  a check to run, so sessions could inherit a false green light.

**Why it hurts:** a model that wrote code is systematically bad at finding its
own bugs (it re-reads its own intent, not the artifact). Weaker models are
worse at this, not better.

**Fix (done + standing rules):**
- Verification gates in CLAUDE.md: `npx tsc --noEmit` must exit 0 before every
  commit; every new SQL migration must be idempotent and must get a
  fresh-context review by a separate agent before being handed to the user.
- "Verify ≠ self-check" protocol in `docs/agents/DELEGATION.md` §6: acceptance
  is checked by a fresh-context agent (read-back for docs, tsc/build/run for
  code, second opinion for high-risk judgment).
- "Definition of done" rubric in `docs/agents/JUDGMENT.md`.

---

## Honorable mentions (lower value, fix opportunistically)

- `README.md` is still the default create-next-app template. Cosmetic, but
  confuses fresh agents for a few hundred tokens. (The `package.json` name
  was `"pdp"` — renamed to `"famms"` on 2026-07-04.)
- `docs/E2E_CHECKLIST.md` step 1 points at old branch `claude/brave-fermi-vubgj6`.
- Auto memory (`~/.claude/projects/<project>/memory/MEMORY.md`) does **not**
  persist here: remote containers are ephemeral. Anything worth remembering
  must be committed to the repo (see MAINTENANCE.md).
