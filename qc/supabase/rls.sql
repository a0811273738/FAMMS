-- ============================================================================
-- FQMS — Row Level Security policies
-- rls.sql — run AFTER schema.sql
-- ============================================================================
-- Role model (profiles.role):
--   inspector   : read master data; create/edit OWN draft/partial inspections
--                 and their results; cannot delete; cannot export.
--   supervisor  : full factory read/write, review/sign-off, master maintenance.
--   manager     : + NCR release decisions, spec approval, CCP disposition.
--   admin       : everything (users, factory, system config).
--
-- Helper functions run as SECURITY DEFINER so a user can read their own role
-- from profiles even while profiles itself is protected by RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Role helper functions
-- ----------------------------------------------------------------------------
create or replace function qc_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- supervisor OR manager OR admin
create or replace function qc_is_supervisor_up()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(qc_user_role() in ('supervisor','manager','admin'), false);
$$;

-- manager OR admin
create or replace function qc_is_manager_up()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(qc_user_role() in ('manager','admin'), false);
$$;

create or replace function qc_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(qc_user_role() = 'admin', false);
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
alter table factories             enable row level security;
alter table profiles              enable row level security;
alter table customers             enable row level security;
alter table products              enable row level security;
alter table suppliers             enable row level security;
alter table test_items            enable row level security;
alter table inspection_stages     enable row level security;
alter table product_specs         enable row level security;
alter table inspection_templates  enable row level security;
alter table template_items        enable row level security;
alter table reference_documents   enable row level security;
alter table instruments           enable row level security;
alter table batches               enable row level security;
alter table inspections           enable row level security;
alter table inspection_results    enable row level security;
alter table ncr_records           enable row level security;
alter table supplier_returns      enable row level security;
alter table customer_complaints   enable row level security;
alter table export_logs           enable row level security;
alter table qc_doc_counters       enable row level security;

-- ============================================================================
-- MASTER DATA
--   Read: any authenticated user.
--   Write: supervisor+ (except users/factories -> admin only).
-- ============================================================================

-- factories: read all authenticated; write admin only.
create policy factories_read on factories
  for select using (auth.uid() is not null);
create policy factories_admin_write on factories
  for all using (qc_is_admin()) with check (qc_is_admin());

-- profiles: everyone reads (needed for tested_by / names); self-update of a
-- limited nature is allowed; role/factory changes are admin-only in practice
-- (enforce via app + this admin_write policy). Users may update their own row
-- for language/pin/phone; admin may do anything.
create policy profiles_read on profiles
  for select using (auth.uid() is not null);
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on profiles
  for all using (qc_is_admin()) with check (qc_is_admin());

-- Generic master-data pattern: read = authenticated, write = supervisor+.
create policy customers_read on customers
  for select using (auth.uid() is not null);
create policy customers_write on customers
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy products_read on products
  for select using (auth.uid() is not null);
create policy products_write on products
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy suppliers_read on suppliers
  for select using (auth.uid() is not null);
create policy suppliers_write on suppliers
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy test_items_read on test_items
  for select using (auth.uid() is not null);
create policy test_items_write on test_items
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy stages_read on inspection_stages
  for select using (auth.uid() is not null);
create policy stages_write on inspection_stages
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy templates_read on inspection_templates
  for select using (auth.uid() is not null);
create policy templates_write on inspection_templates
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy template_items_read on template_items
  for select using (auth.uid() is not null);
create policy template_items_write on template_items
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy refdocs_read on reference_documents
  for select using (auth.uid() is not null);
create policy refdocs_write on reference_documents
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy instruments_read on instruments
  for select using (auth.uid() is not null);
create policy instruments_write on instruments
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

-- ----------------------------------------------------------------------------
-- product_specs: read all; create/edit by supervisor+; APPROVAL by manager+.
--   Spec versioning: creating a new version is a supervisor+ action; setting
--   approved_by/approved_at (the release gate) is enforced at the app layer to
--   manager+, but we also guard writes here so only supervisor+ can touch specs.
-- ----------------------------------------------------------------------------
create policy specs_read on product_specs
  for select using (auth.uid() is not null);
create policy specs_write on product_specs
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

-- ============================================================================
-- EXECUTION LAYER
-- ============================================================================

-- ----------------------------------------------------------------------------
-- batches
--   Read: authenticated. Inspectors may create batches (ch.7 "建批號").
--   Status changes (Hold/return/etc.) and edits to existing batches: supervisor+.
-- ----------------------------------------------------------------------------
create policy batches_read on batches
  for select using (auth.uid() is not null);
create policy batches_insert on batches
  for insert with check (auth.uid() is not null);
create policy batches_update_sup on batches
  for update using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());
create policy batches_delete_sup on batches
  for delete using (qc_is_supervisor_up());

-- ----------------------------------------------------------------------------
-- inspections
--   Read: authenticated (inspectors mostly see own; broad read kept simple —
--         UI filters to "my records" for inspectors).
--   Insert: any authenticated (inspector opens a form).
--   Update by owner: only while draft/partial (still being filled).
--   Update by supervisor+: any inspection (review/sign-off, reopen, reject).
--   Delete: supervisor+ only (inspectors cannot delete).
-- ----------------------------------------------------------------------------
create policy inspections_read on inspections
  for select using (auth.uid() is not null);
create policy inspections_insert on inspections
  for insert with check (
    auth.uid() is not null
    and (opened_by = auth.uid() or qc_is_supervisor_up())
  );
create policy inspections_update_owner on inspections
  for update
  using (opened_by = auth.uid() and status in ('draft','partial'))
  with check (opened_by = auth.uid() and status in ('draft','partial'));
create policy inspections_update_sup on inspections
  for update using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());
create policy inspections_delete_sup on inspections
  for delete using (qc_is_supervisor_up());

-- ----------------------------------------------------------------------------
-- inspection_results
--   Read: authenticated.
--   Insert/Update by inspector: only for a parent inspection they own that is
--     still draft/partial.
--   Supervisor+: full read/write (corrections, lab batch entry).
--   Delete: supervisor+ only.
-- ----------------------------------------------------------------------------
create policy results_read on inspection_results
  for select using (auth.uid() is not null);
create policy results_insert_owner on inspection_results
  for insert with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_id
        and i.opened_by = auth.uid()
        and i.status in ('draft','partial')
    )
  );
create policy results_update_owner on inspection_results
  for update using (
    exists (
      select 1 from inspections i
      where i.id = inspection_id
        and i.opened_by = auth.uid()
        and i.status in ('draft','partial')
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_id
        and i.opened_by = auth.uid()
        and i.status in ('draft','partial')
    )
  );
create policy results_write_sup on inspection_results
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

-- ----------------------------------------------------------------------------
-- ncr_records
--   Read: authenticated.
--   Create: supervisor+ (an NCR is a supervisory disposition document).
--   Update: supervisor+ generally; BUT if the NCR is CCP-linked, the
--     disposition/decision must be made by manager+ (HACCP rule, ch.7).
--     We enforce this with two UPDATE policies:
--       - supervisor+ may update NON-ccp NCRs;
--       - manager+ may update ANY NCR (incl. CCP).
--     A supervisor thus cannot update a CCP NCR row at all (can't set its
--     disposition) — only manager+ can.
-- ----------------------------------------------------------------------------
create policy ncr_read on ncr_records
  for select using (auth.uid() is not null);
create policy ncr_insert on ncr_records
  for insert with check (qc_is_supervisor_up());
create policy ncr_update_nonccp on ncr_records
  for update
  using (qc_is_supervisor_up() and is_ccp = false)
  with check (qc_is_supervisor_up() and is_ccp = false);
create policy ncr_update_ccp_mgr on ncr_records
  for update
  using (qc_is_manager_up())
  with check (qc_is_manager_up());
create policy ncr_delete_mgr on ncr_records
  for delete using (qc_is_manager_up());

-- ----------------------------------------------------------------------------
-- supplier_returns / customer_complaints: read authenticated; write supervisor+.
-- ----------------------------------------------------------------------------
create policy returns_read on supplier_returns
  for select using (auth.uid() is not null);
create policy returns_write on supplier_returns
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

create policy complaints_read on customer_complaints
  for select using (auth.uid() is not null);
create policy complaints_write on customer_complaints
  for all using (qc_is_supervisor_up()) with check (qc_is_supervisor_up());

-- ----------------------------------------------------------------------------
-- export_logs: read supervisor+ (audit trail); INSERT supervisor+ only —
--   inspectors cannot export (ch.6.3). Logs are immutable: no update/delete
--   policies, so even supervisors cannot alter the trail (only admin via
--   admin bypass would need an explicit policy, intentionally omitted).
-- ----------------------------------------------------------------------------
create policy exportlogs_read on export_logs
  for select using (qc_is_supervisor_up());
create policy exportlogs_insert on export_logs
  for insert with check (qc_is_supervisor_up() and exported_by = auth.uid());

-- ----------------------------------------------------------------------------
-- qc_doc_counters: internal numbering table. No direct client access needed
-- (triggers run in the row owner's context and bypass RLS for the SECURITY
-- DEFINER-less trigger only if the caller can write; to be safe we allow the
-- authenticated role to use the counter via the trigger path). We grant a
-- permissive policy limited to authenticated users so inserts that fire the
-- numbering triggers succeed. No one should query it directly.
-- ----------------------------------------------------------------------------
create policy counters_all on qc_doc_counters
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================================
-- END rls.sql
-- ============================================================================
