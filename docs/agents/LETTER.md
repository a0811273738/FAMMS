# LETTER.md — To future sessions in this environment

verified: 2026-07-04

Written 2026-07-04 by Fable 5, the one session of that tier this environment
gets. You, the reader, are probably Sonnet or Haiku. That is fine: the files
around this one convert most of what I'd do by judgment into procedures you
can execute. Read CLAUDE.md's routing table; this letter covers what the user
never asked about but you must know.

## Three things nobody will tell you

### 1. The production database is invisible to you, and it's where the user gets hurt

There is no staging environment. `supabase/*.sql` files are hand-pasted by the
user into the production Supabase SQL Editor. You will never see the real DB
state from this container, so its actual schema can drift from
`supabase/schema.sql` + migrations (the user may have run some files and not
others, or run hotfixes you don't know about).

Consequences:
- The opus review gate on migrations (DELEGATION.md §6) is the single most
  load-bearing rule in this repo. Never skip it, never soften it.
- With every migration, hand the user a **self-check query**: a short SELECT
  that proves it applied, with the expected result stated. Example:
  `SELECT column_name FROM information_schema.columns WHERE
  table_name='pm_schedules' AND column_name='assigned_to';` — "expect 1 row".
  It converts "trust me" into "you can see it worked".
- If behavior contradicts the code and you can't explain it, suspect schema
  drift first; give the user a diagnostic query instead of rewriting code.

### 2. The user is an operator, not a developer — the runbook IS the deliverable

Evidence: `supabase/README.md` teaches, in Traditional Chinese, that you paste
a file's *contents* rather than its *path* into the SQL editor. Calibrate to
that. A change without a zh-TW runbook (exact clicks, exact file, what success
looks like, what to do if it errors) is unfinished work — the code will just
sit there. Never respond with jargon summaries or raw diffs; respond with
"接下來你要做的三步". When something goes wrong on their side, your first ask
should be a copy-pasteable diagnostic, not "check your configuration".

### 3. The repo is the only memory — a solved problem that isn't written down will be solved again, badly

Containers are ephemeral; `~/.claude` auto-memory dies with them; conversation
context dies with compaction. Only committed, pushed files persist. So:
- Push after every completed unit of work. Uncommitted work is already lost;
  you just don't know it yet.
- When you burn a retry round on something a future session will also hit,
  append it to LESSONS.md (format in MAINTENANCE.md) in the same commit as
  the fix. The lessons loop is the only mechanism by which this environment
  gets smarter over time; skipping it is how it stays dumb.
- These governance docs are deliberately in English (models execute English
  instructions most reliably); user-facing replies are always zh-TW.

## How this system will most likely rot, and the antidotes

1. **Ritual compliance** — dispatches that have the shape of the dispatch
   triple but say "acceptance: works correctly". The form survives, the value
   dies. *Antidote:* the litmus test in TEMPLATES.md's checklist — could a
   fresh model with no context grade this criterion? If not, rewrite it before
   dispatching. Verifiers must cite evidence; a bare "PASS" is invalid.
2. **Silent re-drift of CLAUDE.md** — features land, pointers stale, sessions
   learn the docs lie, stop reading them, and we're back to DIAGNOSIS #1.
   *Antidote:* fix-on-catch is mandatory (MAINTENANCE.md "change freely"
   list); staleness you noticed but didn't fix is a rake you left in the
   grass. The budgets exist so re-reading stays cheap enough to actually
   happen.
3. **Rule bloat until nobody reads anything** — every hiccup becomes a lesson,
   LESSONS.md hits 60 entries, sessions skip it, then skip the rest.
   *Antidote:* the promotion/compaction protocol in MAINTENANCE.md, plus the
   bar for lessons: it must have cost a retry round or a user round-trip AND
   be likely to recur. Log rakes, not stumbles.
4. **Verification decay under time pressure** — "tsc passes, it's a small
   change, I'll skip the verifier just this once." That reasoning feels
   correct exactly as often for good changes as for the broken ones; that's
   why it can't be trusted. *Antidote:* definition-of-done D1 is binary. The
   only legitimate shortcut is the inline-work exception written into
   JUDGMENT.md D1 (≤3 files, no SQL, no auth).
5. **Delegation theater** — the opposite failure: dispatching a subagent to
   read one file, burning tokens and latency on ceremony. *Antidote:*
   DELEGATION.md §1's "do inline" list is as binding as the delegate list.

## Handoff status (end of the Fable 5 session)

All deliverables landed and pushed to `claude/fable5-system-design-m7bk7q`:
DIAGNOSIS, CLAUDE.md rewrite (old one archived), DELEGATION + 4 agents in
`.claude/agents/`, JUDGMENT, TEMPLATES, MAINTENANCE + LESSONS seed, this
letter. A fresh-context adversarial review found 13 issues; the fixes are in
the commit titled "Apply adversarial review fixes", followed by a read-back
verification pass.

Known loose ends I deliberately did not fix (they're the repo's, not the
system's): README.md is still the create-next-app template; `package.json`
name is "pdp"; `docs/E2E_CHECKLIST.md` points to old branch
`claude/brave-fermi-vubgj6` and embeds a Supabase project URL. Fix
opportunistically when touching those areas.

One warning to end on: these files make you more effective, not more certain.
When a task is genuinely ambiguous or a judgment call exceeds the rubrics,
the strong move is the honest one — say what you know, what you don't, and
what you'd need. That habit, more than any rule here, is what I'd want to
survive me.
