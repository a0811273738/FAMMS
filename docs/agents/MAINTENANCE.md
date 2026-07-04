# MAINTENANCE.md — How to update the governance files safely

Applies to: `CLAUDE.md`, everything in `docs/agents/`, `.claude/agents/*.md`.
These files are the environment's only durable memory (containers are
ephemeral; `~/.claude` auto-memory does not survive them). Treat them like
production code: wrong edits here damage every future session.

## What you may change freely (no user approval needed)

- **Fixing verified factual drift**: a path, filename, command, or "X exists /
  doesn't exist" claim that you confirmed against the repo is wrong. Fix it in
  place, note the old claim in the commit message.
- **Appending lessons to `docs/agents/LESSONS.md`** (format below).
- **Adding a pointer** to a new file/module in CLAUDE.md's "Domain model" or
  routing table (one line, no new rules).
- **Updating `verified:` dates** after re-checking a claim.

## What requires asking the user first

- Changing or removing any **rule** (Hard Constraints, delegation rules,
  judgment rubrics, review gates). Rules encode past failures; if a rule seems
  wrong, the likely explanation is missing context — check DIAGNOSIS.md and
  LESSONS.md for its origin first, then ask, citing the rule and your evidence.
- Changing `.claude/agents/*` **model or effort pins**, or removing an agent.
- Deleting any file in `docs/agents/` or `docs/archive/`.
- Any edit that makes a rule LOOSER (e.g. raising the ">5 files" delegation
  threshold, dropping the opus migration gate).
- Rewriting CLAUDE.md wholesale.

## The lessons loop (do this every time you step on a rake)

Trigger: a subagent or you failed in a way that cost a retry round, a user
round-trip, or a broken deliverable — AND the failure would recur for a future
session.

1. Append to `docs/agents/LESSONS.md` using exactly this format:

```markdown
## L-⟨next number⟩ · ⟨YYYY-MM-DD⟩ · ⟨3-6 word title⟩
- Situation: ⟨1-2 lines: task + what went wrong⟩
- Root cause: ⟨1 line — the wrong assumption, not the symptom⟩
- Rule: ⟨1-2 lines, imperative, checkable — what a future session must do differently⟩
- Evidence: ⟨commit hash / file:line / error message⟩
```

2. If the lesson contradicts an existing rule → don't silently edit the rule;
   ask the user (see above).
3. Commit with message `Lesson L-⟨n⟩: ⟨title⟩` and push. An unpushed lesson
   doesn't exist.

## Compaction protocol (keep the corpus loadable)

- Budgets: CLAUDE.md ≤ 120 lines · each `docs/agents/*.md` ≤ 250 lines ·
  LESSONS.md ≤ 40 lessons.
- When LESSONS.md exceeds ~15 entries, check for clusters: 3+ lessons with the
  same root-cause family should be promoted into ONE rule in the appropriate
  file (Hard Constraint, DELEGATION, or JUDGMENT) — this is a rule change, so
  ask the user, proposing the consolidated wording and which L-numbers it
  replaces. After approval, replace those entries with one line:
  `## L-x,L-y,L-z → promoted to ⟨file⟩ §⟨section⟩ on ⟨date⟩`.
- Never delete a lesson without promotion or user approval.
- When any file busts its budget, propose a diff to the user that cuts the
  lowest-value content; don't cut silently.

## Verified-date convention

Any sentence in these files asserting repo state ("X exists", "there are no
tests") is trustworthy only as of the file's last verification. When you catch
a stale claim, fix it AND update the nearest `verified:`/dated marker. If you
rely on a claim for something risky, re-verify it against the repo first —
code is truth, docs are hints.

## Editing mechanics

1. Read the whole target file before editing (not just the section).
2. For rule changes (user-approved): keep a dated note of the old wording in
   the commit message body.
3. After editing, dispatch famms-verifier for a read-back against your
   intended changes, then commit and push. Governance edits ride the current
   working branch unless the user says otherwise.
