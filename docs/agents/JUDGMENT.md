# JUDGMENT.md — Decision rubrics

Judgment calls, converted into checkable rules. Each rule has a YES example
(apply the rule) and a NO example (don't). When a situation matches none of
these, default to: state your uncertainty to the user in one paragraph and
propose ONE course of action — don't silently guess, don't list five options.

---

## 1. When to escalate to a stronger model

Escalate (per the ladder in DELEGATION.md §4) when ANY of:
- E1. Same subtask failed twice on the current model against written
  acceptance criteria.
- E2. The task is listed as opus-mandatory: SQL migration/RLS review,
  security-sensitive change, architecture decision with >1 defensible answer.
- E3. You cannot explain WHY the previous attempt failed. (If you can explain
  it, fix the prompt and retry same model — that's cheaper.)

✅ YES: sonnet twice produced an RLS policy that still let technicians update
other factories' incidents; both attempts failed the verifier. → opus, with
both failed policies + verifier output attached.
❌ NO: sonnet's first attempt failed because the dispatch prompt forgot to
mention the i18n rule. That's a prompt bug — fix the prompt, retry sonnet.
Escalating here wastes money and teaches you nothing.

## 2. When something is actually DONE

All must hold; check them literally, one by one:
- D1. Every acceptance criterion from the original request has a verifier
  verdict of PASS (or an explicit, user-visible CANNOT-VERIFY with reason).
- D2. `npx tsc --noEmit` exits 0 (run it; don't trust memory or a subagent's
  claim without the exit status).
- D3. New user-facing strings exist in all of `src/lib/i18n/locales/{zh,en,id}.json`.
- D4. Any new SQL migration passed a famms-reviewer (opus) verdict of APPROVE
  or APPROVE-WITH-NITS.
- D5. Work is committed AND pushed to the designated branch.
- D6. The user got a zh-TW summary: what changed, what was verified, what
  wasn't, and any manual step they must do (e.g. run a migration).

✅ YES: PM-assignee feature: verifier PASSed all criteria, tsc 0, keys in 3
locales, migration APPROVEd, pushed, user told to run migration_pm_assignee.sql.
❌ NO: "code compiles and looks right, I'll mark it done" — D1 was never
checked by a fresh context. That is exactly how the RLS Phase 2 chain shipped
three broken versions (DIAGNOSIS.md #3).

## 3. When to stop and ask the user

Ask FIRST (one batched question set, then continue) when ANY of:
- A1. The action is irreversible or outward-facing: deleting data, changing
  production DB schema beyond what was asked, sending Telegram messages to
  real groups, force-pushing over unmerged commits.
- A2. Two readings of the request lead to materially different implementations
  (>30 min of divergent work), and the repo offers no evidence for either.
- A3. Fulfilling the request requires violating a Hard Constraint in
  CLAUDE.md, or contradicts something the user said earlier.
- A4. You need a secret/credential or a manual step only the user can do.

Do NOT ask when the answer is discoverable in the repo, when one reading is
clearly conventional, or merely to get reassurance ("shall I proceed?").

✅ YES: "clean up the incident statuses" — does that mean rename labels
(cosmetic) or remove enum values (migration + data backfill)? Materially
different and irreversible → ask, offering a recommendation.
❌ NO: "add the machine's serial number to the detail page" — where on the
page? Pick the obvious spot next to the other master-data fields, note the
choice in your summary. Asking would just burn a round-trip.

## 4. Signals that the DIRECTION is wrong (change approach, don't retry)

Stop retrying and change approach when ANY of:
- W1. Two retry rounds consumed (hard cap, DELEGATION.md §4).
- W2. Each "fix" creates a new error in a different place — you're playing
  whack-a-mole, which means the mental model of the system is wrong. Go read
  the actual source (or Next.js docs in node_modules/next/dist/docs/) before
  writing more code.
- W3. Your fix requires disabling or working around a safety mechanism
  (skipping tsc errors with `any`/`@ts-ignore`, loosening an RLS policy,
  deleting a failing check) — the mechanism is usually right and you are
  usually wrong.
- W4. The diff keeps growing relative to the size of the ask (a "small fix"
  now touches 15 files) — back out and find the narrow cause.
- W5. You're editing generated or vendored code (node_modules, lockfile by
  hand) to make something work.

"Change approach" means: write down (for yourself) what the failed approach
assumed, verify that assumption directly against code/docs, and pick a path
that doesn't rest on it. If no alternative path exists → ask the user (rule 3).

✅ YES: dropdown styling fix failed twice; each attempt broke a different page.
W1+W2 → stop, read src/components/ui/dropdown-menu.tsx and the Base UI docs;
discover the component API differs from Radix training data; fix once at the
right layer.
❌ NO: first attempt failed with a clear, understood error ("key missing in
id.json"). That's not wrong direction, that's an unfinished step — just do it.

## 5. Quality floor — how to check it without taste

Weaker models cannot reliably judge "is this good code"; they CAN run this
checklist. Before any commit:

- Q1. Read the final diff top to bottom (`git diff`) — no debug prints, no
  commented-out code, no TODO you silently added, no stray files.
- Q2. Consistency: new code imports from `@/components/ui/*` and `@/lib/*`
  like its neighbors; UI text uses `t()`; styling uses Tailwind classes in the
  file's existing style. If your new file looks structurally different from
  the file next to it, that's a defect even if it works.
- Q3. Failure paths: every `await` that can reject is handled the way the
  surrounding code handles it (toast / error return); user sees an error
  state, not a silent nothing.
- Q4. Roles: if the feature reads/writes data, check src/lib/permissions.ts —
  which of the 5 roles should see it? Did you gate both the UI and the API?
- Q5. The one-sentence test: you can state in one sentence what the change
  does and every file in the diff is explainable by that sentence.

✅ YES: a 4-file diff where each file maps to "supervisors can reassign an
incident", errors toast in zh/en/id, API route checks role.
❌ NO: "tsc passes" as the whole quality argument. tsc doesn't see missing
role checks, silent catch blocks, or hardcoded Indonesian strings.

---

## Honest limits (what these rubrics CANNOT fix)

Rubrics + fresh-context verification recover *execution* quality on weaker
models. They do NOT recover:
- **Taste / ambiguous product judgment** ("which of these two UX flows is
  better for factory technicians?") — present both to the user with
  trade-offs, or prototype the cheaper one. Do not let a rubric fake a
  confident answer.
- **Novel architecture under uncertainty** — escalate to opus; if opus is
  genuinely unsure, say so to the user rather than laundering uncertainty
  through confident prose.
- **Unknown unknowns in production** (real Supabase state, real Telegram
  groups) — you cannot see them from this container. Mark CANNOT-VERIFY and
  hand the user a concrete manual check (exact URL/query to run).

When you hit one of these, the deliverable is an honest framing of the
decision, not a forced answer.
