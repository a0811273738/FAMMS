-- Migration: Gudang One (warehouse app) lookup/status-sync link fields.
-- Additive only — run after schema.sql + rls.sql + seed_test_items.sql.
-- Safe to re-run (IF NOT EXISTS guards).
--
-- Context: batches.gudang_ref (schema.sql) already held a free-text
-- warehouse reference. This migration adds the structured metadata the
-- "pull batch from Gudang" lookup flow and the qc-status push-back need,
-- plus an optional machine_code on NCRs for a future FAMMS work-order link
-- (Phase 2, not implemented yet — column only).

alter table batches
  add column if not exists gudang_meta jsonb;
comment on column batches.gudang_meta is
  'Structured link to a Gudang One warehouse batch, set when the batch was '
  'pulled via "Ambil dari Gudang": {"gudang_batch_id": "...", "lot_no": "...", '
  '"warehouse": "..."}. Null for batches entered manually. Read this to decide '
  'whether a qc-status push-back applies to this batch.';

alter table ncr_records
  add column if not exists machine_code text;
comment on column ncr_records.machine_code is
  'Optional free-text machine/asset code when a quality issue is suspected '
  'equipment-caused. Collected now for a future one-click FAMMS work-order '
  'link (Phase 2); not otherwise used in Phase 1.';
