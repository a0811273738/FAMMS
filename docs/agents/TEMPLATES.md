# TEMPLATES.md — Dispatch prompt templates

verified: 2026-07-04

Copy the matching template into the Agent tool's `prompt`, fill every ⟨blank⟩,
delete lines that don't apply. Never dispatch a prompt missing the acceptance
criteria or report format — those two are what make weak-model delegation work.

Pick agent type per DELEGATION.md §3 (`famms-scout` / `famms-implementer` /
`famms-verifier` / `famms-reviewer`; fall back to `general-purpose` +
explicit `model` if the type isn't offered).

---

## 1. SEARCH / SCAN → famms-scout

```text
GOAL: Find ⟨what⟩ in /home/user/FAMMS, because ⟨why — what decision this feeds⟩.

SEARCH AT LEAST: ⟨dirs, e.g. src/app, src/components, src/lib, supabase/⟩.
Try these terms AND their variants: ⟨identifiers, English UI words, and
locale-string spellings — check src/lib/i18n/locales/*.json for the id/zh text⟩.

ACCEPTANCE:
- Every match listed as path:line with a ≤1-line note on its role.
- Explicit "not found in ⟨dir⟩" for each searched location with no hits.
- A "Verified / Assumptions" section at the end.

REPORT: conclusions only, no file contents. >30 items → write to
⟨scratchpad path⟩ and reply with path + ≤10-line summary.
```

## 2. IMPLEMENTATION → famms-implementer

```text
GOAL: ⟨feature/fix in one sentence⟩. Motivation: ⟨user-visible why⟩.

CONTEXT YOU NEED: read /home/user/FAMMS/CLAUDE.md (Hard Constraints are
binding). Relevant files: ⟨paths from scout, with one line each on why⟩.
Known constraints for this task: ⟨e.g. only supervisors may see the button;
must work on mobile bottom-nav layout⟩.

SCOPE: change only ⟨paths/areas⟩. If you believe another file must change,
report it — don't do it.

ACCEPTANCE:
- ⟨criterion 1 — observable behavior, e.g. "POST /api/x returns 403 for role=technician"⟩
- ⟨criterion 2⟩
- npx tsc --noEmit exits 0 (include the exit status in your report).
- New UI strings present in all of src/lib/i18n/locales/{zh,en,id}.json.
- ⟨if schema changes⟩ New idempotent supabase/migration_⟨topic⟩.sql; do NOT
  edit schema.sql or old migrations.

DO NOT commit or push.

REPORT: files changed (path:line + 1 line each), tsc exit status,
Verified vs Assumptions. No diffs pasted.
```

## 3. REFACTOR / BATCH EDIT → famms-implementer (sonnet), or haiku if the edit is fully mechanical

```text
GOAL: Apply this exact pattern everywhere it occurs. Motivation: ⟨why⟩.

PATTERN (before → after):
⟨minimal concrete example of the old code⟩
→
⟨minimal concrete example of the new code⟩

TARGET LIST (from scout — do not expand it yourself):
⟨path:line list⟩

RULES: behavior must not change; keep each file's local style; if a target
doesn't actually match the pattern, SKIP it and list it under "skipped: reason"
instead of forcing the edit.

ACCEPTANCE: every target either edited or listed as skipped-with-reason;
npx tsc --noEmit exits 0; no file outside the target list touched
(git status must show only listed files).

REPORT: counts (edited/skipped), skipped list with reasons, tsc status.
```

## 4. RESEARCH (docs/web) → general-purpose (sonnet)

```text
GOAL: Answer: ⟨precise question⟩. This feeds: ⟨the decision at stake⟩.

SOURCES: prefer, in order: ⟨e.g. node_modules/next/dist/docs/ for Next.js
(npm install first if missing); official docs sites⟩. This project runs: Next.js 16 / @base-ui/react 1.x /
Tailwind v4 / Supabase JS v2 — answers valid for other major versions are
wrong answers here.

ACCEPTANCE:
- Each claim tagged [verified: ⟨source/URL/file⟩] or [unverified].
- Version-specific: state which version the answer applies to.
- If sources conflict or you can't find it, say so — do NOT fill gaps from
  training-data memory without tagging [unverified].

REPORT: numbered answers, ≤5 lines each, sources cited. Long excerpts → file
in scratchpad, path in reply.
```

## 5. REVIEW / SECOND OPINION → famms-reviewer (opus)

```text
GOAL: Review ⟨file(s) / diff / decision⟩ before ⟨what happens next, e.g. "the
user runs this against production Supabase"⟩.

WHAT TO JUDGE AGAINST: the goal "⟨original task in one sentence⟩", the Hard
Constraints in /home/user/FAMMS/CLAUDE.md, and ⟨task-specific criteria⟩.
⟨For migrations: the mandatory checklist is in your agent definition.⟩

YOU HAVE NO PRODUCER CONTEXT ON PURPOSE. Judge only what's on disk:
⟨exact paths, or "the diff of git diff ⟨base commit hash⟩..HEAD" — note:
remote containers have no main ref, so name an explicit base commit⟩.

REPORT: verdict line (APPROVE / APPROVE-WITH-NITS / REQUEST-CHANGES) first,
then findings ranked by severity, each with path:line + failure scenario +
fix direction. No style nits unless asked.
```

## 6. VERIFICATION → famms-verifier (after templates 2 or 3)

```text
GOAL: Verify the following work was actually completed. You have no history —
trust nothing, check everything on disk.

ORIGINAL ACCEPTANCE CRITERIA (verbatim from the dispatch):
⟨paste them⟩

CHECKS: read the touched files; run npx tsc --noEmit; ⟨npm run build if
config/routing changed⟩; ⟨any flow to exercise, e.g. "confirm the API route
rejects role=technician by reading the guard code"⟩.

REPORT: one PASS / FAIL / CANNOT-VERIFY line per criterion with evidence
(path:line or command + exit status), then Observations. ≤40 lines.
```

---

### Dispatch checklist (main model, before pressing go)

- [ ] Goal AND motivation present
- [ ] Acceptance criteria objectively checkable (a fresh model could grade them)
- [ ] Report format stated, "no file dumps" included
- [ ] Right agent type / model per DELEGATION.md §3
- [ ] Independent dispatches batched in one message; dependent ones sequenced
