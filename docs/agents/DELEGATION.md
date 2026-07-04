# DELEGATION.md — Model dispatch rules

verified: 2026-07-04

For the MAIN model in every session. Verified against Claude Code docs
2026-07-04 (subagents: https://code.claude.com/docs/en/subagents.md).

## 1. The commander does not fight

The main conversation is a scarce resource: every raw file dump pushed into it
brings compaction closer, and compaction is where constraints and acceptance
criteria get silently lost. Therefore:

**Delegate to a subagent, keep only conclusions in the main conversation:**
- Reading more than ~5 files, or any file you only need a summary of
- Repo-wide scans ("find every place that…", "audit all migrations for…")
- Web research / documentation lookups
- Batch edits applying one known pattern to many files
- Reviews and verification (see §6 — these MUST be delegated, fresh context)

**Do inline, don't delegate:**
- Reading 1–3 specific files you will edit yourself (up to ~5 reads total)
- Small edits (≤3 files, no SQL, no auth/permissions) where you already know
  exactly what to change
- Anything where explaining the task costs more than doing it
- Talking to the user

If in doubt: will the raw output of this step matter later in the
conversation? If only the conclusion matters → delegate.

## 2. Dispatch triple — every delegation prompt contains all three

1. **Goal + motivation** — what to produce AND why/for whom, so the agent can
   make sane micro-decisions. ("Find all queries touching `incidents.status`
   because we're adding a new status value and must not miss a switch.")
2. **Acceptance criteria** — objectively checkable. ("Done = a list covering
   src/app/api AND src/components; each entry has file:line; you grep'd for
   both `status` and the literal status strings.")
3. **Report format** — exactly what comes back (see §5).

Copy-paste templates for the five common task shapes are in
`docs/agents/TEMPLATES.md`. Use them; don't improvise a prompt from scratch.

## 3. Which model and effort — say it explicitly, every time

Mechanics (verified):
- The Agent tool takes a per-call `model` parameter: `haiku` | `sonnet` |
  `opus` (| `fable` only if a Fable-tier session; do not rely on it).
- Reasoning `effort` can NOT be set per call. It is pinned in the subagent
  definition frontmatter (`.claude/agents/*.md`, field `effort:` =
  low|medium|high|xhigh|max). That is why this repo defines its own agents —
  **prefer them over generic types**:

| Agent type (this repo) | Model/effort | Use for |
|---|---|---|
| `famms-scout` | sonnet / medium, repo-read-only* | search, scans, "where is X / does Y exist" |
| `famms-implementer` | sonnet / high | features, fixes, batch edits |
| `famms-verifier` | sonnet / high, repo-read-only* | acceptance checks: read-back, tsc, build, run |
| `famms-reviewer` | opus / high, repo-read-only* | SQL migrations, security/RLS, architecture, second opinions |

\* "repo-read-only" is enforced by instruction, not by the harness (they keep
Bash for checks, and scout/verifier may Write scratchpad files only). Don't
hand them prompts that ask for repo edits.

If a `famms-*` type is not offered by the Agent tool in your session, fall back
to `general-purpose` (or read-only `Explore` for scout work) and pass `model`
explicitly.

Model choice rubric:
- **haiku**: only for mechanically applying an already-proven pattern (the exact
  edit is specified; judgment ≈ 0). Never for anything touching SQL or auth.
- **sonnet**: the default worker for everything.
- **opus**: escalation target (§4), migration/RLS review, architecture
  decisions, second opinions. Don't start at opus for routine work.

## 4. Escalation & downgrade ladder

- **haiku fails once** on a subtask → redo on sonnet immediately. Do not debug
  haiku's attempt.
- **sonnet fails the same subtask twice** → escalate to opus, and include the
  full failure trail (both attempts: what was tried, exact errors, files
  touched). Escalating without the trail wastes the escalation.
- **Pattern solved** (e.g. opus figured out the fix for one file of a batch) →
  downgrade: extract the pattern into explicit instructions and have
  haiku/sonnet apply it to the remaining cases.
- **Hard cap: two retry rounds per approach *on the same model*.** Escalating
  to a stronger model counts as changing approach and resets the count. The
  cap forbids a third retry with the same model and the same approach — after
  that, stop, re-read `docs/agents/JUDGMENT.md` §"wrong direction", change
  approach or ask the user. The full ladder is: haiku ×1 → sonnet ×2 →
  opus ×2 → user.
- Count honestly: "failed" = did not meet the written acceptance criteria.
  A partial result that skipped the criteria is a failure, not a success.

## 5. Report contract (put this in every dispatch prompt)

> Report back: conclusions only. Reference code as `path:line`. Do NOT paste
> file contents or diffs into your reply. If output is long (a report, a list
> >30 items, generated code for me to review), write it to a file and reply
> with the path + a ≤10-line summary. State explicitly: what you verified vs
> what you assume. If you failed or are unsure, say so plainly — a false
> "done" costs 10× more than an honest "stuck".

Where subagents write long artifacts: analysis/scratch → the session scratchpad
dir; anything worth keeping across sessions → `docs/` in the repo, committed by
the MAIN model after it reviews the content (subagents never commit or push).

## 6. Verification is never self-verification

The agent (or main model) that produced work does not grade it. Acceptance runs
in a FRESH context — a new `famms-verifier` dispatch that gets the acceptance
criteria but NOT the producer's reasoning:

- **Files/docs** → read-back: verifier reads the actual files on disk and
  confirms each acceptance criterion against file contents, citing line numbers.
- **Code** → verifier runs `npx tsc --noEmit` (and `npm run build` for
  anything touching routing/config), and exercises the affected flow where
  possible; otherwise reports exactly what could not be exercised.
- **SQL migrations** → mandatory `famms-reviewer` (opus) pass before the file
  is handed to the user: checks idempotency, that every referenced
  table/column exists in `supabase/schema.sql` + prior migrations, RLS
  lockout risk, and safe re-run. (This gate exists because of the RLS Phase 2
  fix-of-fix chain — see DIAGNOSIS.md #3.)
- **High-risk judgment calls** (irreversible, security, data loss) → second
  opinion from `famms-reviewer`; if the two opinions disagree, surface the
  disagreement to the user instead of picking silently.

A verifier that replies "all good" without citing evidence (line numbers,
command output) has not verified. Re-dispatch.

## 7. Worked example

Task: "add a `cancelled` incident status".

1. Dispatch `famms-scout`: find every file that branches on IncidentStatus
   (acceptance: covers src/types, src/lib, src/components, src/app; file:line
   list; also checks locale JSONs and supabase SQL for status enums).
2. Main model designs the change from the scout's list (small, judgment-heavy
   → inline).
3. Dispatch `famms-implementer` with the dispatch triple + the file list;
   includes new migration `supabase/migration_incident_status_cancelled.sql`
   and keys in all 3 locale files.
4. Dispatch `famms-verifier`: tsc exits 0; every file from step 1's list
   updated or explicitly ruled out; 3 locales have the key.
5. Dispatch `famms-reviewer` (opus) on the migration file only.
6. Main model commits, pushes, reports to user in zh-TW.
