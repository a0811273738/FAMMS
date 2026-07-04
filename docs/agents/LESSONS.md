# LESSONS.md — Accumulated failure lessons

verified: 2026-07-04

Append-only log. Format and promotion/compaction rules: `docs/agents/MAINTENANCE.md`.
Read the last ~10 entries at the start of any nontrivial task.

## L-1 · 2026-07-04 · Docs drifted into a different project
- Situation: CLAUDE.md accumulated a second project's full docs plus stale
  status; sessions were misled for an unknown number of turns.
- Root cause: status/docs were edited by appending, never by reconciling
  against the repo.
- Rule: never append a second "status" or "tech stack" section — reconcile the
  existing one. Before trusting any doc claim about repo state, verify with
  Glob/Grep.
- Evidence: `git show 635a4b7:CLAUDE.md` (duplicate Tech Stack sections; a
  Windows path from the other project). File deleted from the tree at user
  request.

## L-2 · 2026-07-04 · SQL shipped without independent review
- Situation: RLS Phase 2 migration needed three corrective commits; each
  round-trip cost the user a failed paste into production Supabase.
- Root cause: producer self-verified; nobody cross-checked referenced columns
  against schema.sql + prior migrations, or simulated role lockout.
- Rule: every migration gets a famms-reviewer (opus) APPROVE before reaching
  the user (DELEGATION.md §6).
- Evidence: commits e0e761a, a8cb35a, 083240d.

## L-3 · 2026-07-04 · Framework assumptions from training data
- Situation: this repo runs Next.js 16 and Base UI, both of which differ from
  what models "remember"; Radix idioms (asChild) don't exist here.
- Root cause: writing framework code from memory instead of the shipped docs.
- Rule: for Next.js questions read node_modules/next/dist/docs/ first; for UI
  components read the existing src/components/ui/* wrapper before using it.
- Evidence: AGENTS.md warning; package.json (next 16.2.9, @base-ui/react).
