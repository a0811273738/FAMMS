-- ============================================================================
-- FQMS — Food Quality Management System (Nata de Coco / Tapioca Pearl)
-- schema.sql — Tables, indexes, triggers, auto-numbering
-- ============================================================================
-- Independent system (NOT related to FAMMS). Runs in its own Supabase project.
-- Design philosophy: lean core (5 tables) + extension sockets.
--
-- Conventions:
--   * PK = uuid DEFAULT gen_random_uuid()
--   * created_at / updated_at on every table; updated_at maintained by trigger
--   * enum-like columns = text + CHECK constraint (NOT pg enum) so values can be
--     added later without ALTER TYPE migrations.
--   * FK ON DELETE chosen per relationship (RESTRICT for master data referenced
--     by records, CASCADE for owned child rows, SET NULL for soft links).
--
-- Run order:  schema.sql  ->  rls.sql  ->  seed_test_items.sql
-- ============================================================================

-- Required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared trigger function: keep updated_at fresh (moddatetime equivalent).
-- Kept self-contained so we don't depend on the `moddatetime` contrib module.
-- ----------------------------------------------------------------------------
create or replace function qc_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- AUTO-NUMBERING INFRASTRUCTURE
-- ----------------------------------------------------------------------------
-- Per-(doc_type, date) monotonic counter. Concurrency-safe: the INSERT ...
-- ON CONFLICT DO UPDATE ... RETURNING is a single atomic statement that takes a
-- row lock on the counter row, so two concurrent inserts can never receive the
-- same sequence number (the second one blocks on the row lock, then reads the
-- incremented value). No gaps under normal operation; a rolled-back transaction
-- may leave a gap, which is acceptable for human-readable document numbers.
-- ============================================================================
create table qc_doc_counters (
  doc_type  text  not null,               -- 'QC' | 'NCR' | 'CMP' | 'RET' ...
  seq_date  date  not null,
  last_no   integer not null default 0,
  primary key (doc_type, seq_date)
);

-- Returns the next integer in the (prefix, dt) series, atomically.
create or replace function qc_next_seq(p_prefix text, p_date date)
returns integer
language plpgsql
as $$
declare
  v_no integer;
begin
  insert into qc_doc_counters (doc_type, seq_date, last_no)
  values (p_prefix, p_date, 1)
  on conflict (doc_type, seq_date)
  do update set last_no = qc_doc_counters.last_no + 1
  returning last_no into v_no;
  return v_no;
end;
$$;

-- ============================================================================
-- SECTION 1 — ORGANIZATION & AUTH
-- ============================================================================

-- factories: single-factory to start, but modelled multi-tenant for growth.
create table factories (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- e.g. 'SJA'
  name        text not null,
  address     text,
  timezone    text not null default 'Asia/Jakarta',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- profiles: mirrors auth.users (id = auth.uid()). Roles are QC-specific.
--   pin_code    : 4-digit PIN for fast user switching on a shared tablet.
--   preferred_language : id (default for inspectors) | zh | en
create table profiles (
  id                  uuid primary key,      -- references auth.users(id)
  factory_id          uuid references factories(id) on delete set null,
  full_name           text not null default '',
  role                text not null default 'inspector'
                        check (role in ('inspector','supervisor','manager','admin')),
  pin_code            text
                        check (pin_code is null or pin_code ~ '^[0-9]{4,6}$'),
  preferred_language  text not null default 'id'
                        check (preferred_language in ('id','zh','en')),
  phone               text,
  telegram_chat_id    text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_profiles_factory on profiles(factory_id);
create index idx_profiles_role    on profiles(role);

-- ============================================================================
-- SECTION 2 — MASTER DATA (settings layer, maintained by supervisor+)
-- ============================================================================

-- customers: each may have customer-specific specs + CoA language preference.
create table customers (
  id            uuid primary key default gen_random_uuid(),
  factory_id    uuid references factories(id) on delete set null,
  code          text,
  name          text not null,
  country       text,
  contact       text,
  coa_language  text not null default 'en'
                  check (coa_language in ('en','id')),
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_customers_factory on customers(factory_id);

-- products: finished-goods / material master.
create table products (
  id                uuid primary key default gen_random_uuid(),
  factory_id        uuid references factories(id) on delete set null,
  product_code      text not null,
  name_id           text not null,           -- Bahasa Indonesia (primary)
  name_zh           text,
  name_en           text,
  category          text not null default 'other'
                      check (category in ('nata_de_coco','tapioca_pearl','syrup','raw_material','packaging','other')),
  md_number         text,                    -- BPOM MD registration (Izin Edar)
  halal_cert_no     text,
  halal_expiry      date,
  shelf_life_days   integer,
  storage_condition text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (factory_id, product_code)
);
create index idx_products_factory  on products(factory_id);
create index idx_products_category on products(category);

-- suppliers: quality rating derived from incoming pass-rate + return-rate.
create table suppliers (
  id              uuid primary key default gen_random_uuid(),
  factory_id      uuid references factories(id) on delete set null,
  code            text,
  name            text not null,
  material_types  text,                      -- free text / comma list
  contact         text,
  halal_cert_no   text,
  halal_expiry    date,                       -- expiry pre-warning
  rating          numeric(4,2),               -- 0..100, auto-calculated
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_suppliers_factory on suppliers(factory_id);

-- test_items: the shared inspection-item dictionary. result_type is the core
-- flexibility knob (numeric / pass_fail / select / text).
create table test_items (
  id             uuid primary key default gen_random_uuid(),
  item_code      text not null unique,        -- PH_001, BRIX_001, TPC_001 ...
  name_id        text not null,               -- Bahasa (primary)
  name_zh        text,
  name_en        text,
  category       text not null default 'physical'
                   check (category in ('sensory','physical','chemical','micro','packaging','hygiene')),
  result_type    text not null default 'numeric'
                   check (result_type in ('numeric','pass_fail','select','text')),
  unit           text,                        -- %, mm, °Brix, CFU/g, APM/g ...
  select_options jsonb,                        -- ["正常","偏黃","異常"] when result_type='select'
  test_method    text,                        -- SNI xx-xxxx / AOAC / internal SOP
  is_external    boolean not null default false, -- outsourced (heavy metals, Salmonella)
  sensitivity    text not null default 'public'  -- field-level classification (ch.6.3)
                   check (sensitivity in ('public','internal','confidential')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_test_items_category on test_items(category);

-- inspection_stages: configurable data (seeded, but extendable in-app).
create table inspection_stages (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- incoming / in_process / final / water ...
  name_id     text not null,
  name_zh     text,
  name_en     text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- product_specs: versioned spec standards. THE compliance core.
--   customer_id NULL = generic spec; non-null = customer-specific (overrides).
--   Resolution order: customer-specific -> generic.
--   Versioning: version + effective_from/effective_to; results lock spec_id.
create table product_specs (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  test_item_id   uuid not null references test_items(id) on delete restrict,
  customer_id    uuid references customers(id) on delete cascade,  -- NULL = generic
  stage          text not null references inspection_stages(code) on delete restrict,
  spec_min       numeric,                     -- numeric result_type
  spec_max       numeric,
  spec_target    numeric,
  spec_text      text,                        -- pass_fail / select standard ("不得檢出")
  sample_count   integer not null default 1,  -- default sampling count (e.g. 5 pails)
  judgment_mode  text not null default 'average'
                   check (judgment_mode in ('average','each_sample')),
  is_mandatory   boolean not null default true,
  is_ccp         boolean not null default false,  -- HACCP critical control point
  regulation_ref text,                         -- "SNI 01-4317" / "BPOM No.13/2019" / "客戶規格"
  version        integer not null default 1,
  effective_from date not null default current_date,
  effective_to   date,                         -- NULL = currently effective
  created_by     uuid references profiles(id) on delete set null,
  approved_by    uuid references profiles(id) on delete set null,
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_specs_product   on product_specs(product_id);
create index idx_specs_item      on product_specs(test_item_id);
create index idx_specs_customer  on product_specs(customer_id);
create index idx_specs_stage     on product_specs(stage);
-- Fast lookup of the currently-effective spec (customer or generic) per product/item/stage.
create index idx_specs_effective on product_specs(product_id, test_item_id, stage, customer_id, effective_from)
  where effective_to is null;

-- inspection_templates: product x stage -> one form.
create table inspection_templates (
  id            uuid primary key default gen_random_uuid(),
  factory_id    uuid references factories(id) on delete set null,
  template_name text not null,
  product_id    uuid not null references products(id) on delete cascade,
  stage         text not null references inspection_stages(code) on delete restrict,
  sampling_note text,                          -- "每批抽3桶、每2小時1次..."
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_templates_product on inspection_templates(product_id);
create index idx_templates_stage   on inspection_templates(stage);

-- template_items: ordered items within a template.
create table template_items (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references inspection_templates(id) on delete cascade,
  test_item_id  uuid not null references test_items(id) on delete restrict,
  sort_order    integer not null default 0,
  default_value text,                          -- speeds up entry
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (template_id, test_item_id)
);
create index idx_template_items_template on template_items(template_id);

-- reference_documents: standards library (limit-sample photos, SNI/BPOM PDFs,
-- customer specs, SOPs). Linked to items/products via JSONB arrays of uuids.
create table reference_documents (
  id                uuid primary key default gen_random_uuid(),
  factory_id        uuid references factories(id) on delete set null,
  title             text not null,
  doc_type          text not null default 'internal_sop'
                      check (doc_type in ('sni_standard','bpom_regulation','internal_sop',
                                          'customer_spec','limit_sample_photo','defect_photo','other')),
  file_url          text,                       -- Supabase Storage path (PDF / image)
  linked_test_items jsonb not null default '[]'::jsonb,   -- [uuid,...]
  linked_products   jsonb not null default '[]'::jsonb,   -- [uuid,...]
  version           integer not null default 1,
  effective_from    date not null default current_date,
  effective_to      date,
  uploaded_by       uuid references profiles(id) on delete set null,
  notes             text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_refdocs_type on reference_documents(doc_type);
create index idx_refdocs_linked_items on reference_documents using gin (linked_test_items);
create index idx_refdocs_linked_products on reference_documents using gin (linked_products);

-- instruments: instrument master + calibration (Phase 3 use; socket built now).
create table instruments (
  id              uuid primary key default gen_random_uuid(),
  factory_id      uuid references factories(id) on delete set null,
  code            text,
  name            text not null,               -- pH meter, refractometer, balance ...
  serial_no       text,
  location        text,
  last_calibrated date,
  next_due        date,                          -- expiry pre-warning / input lock
  cert_no         text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_instruments_factory on instruments(factory_id);

-- ============================================================================
-- SECTION 3 — EXECUTION LAYER (records produced by inspectors)
-- ============================================================================

-- batches: traceability core. Batch status machine drives Hold/return control.
--   parent_batch_ids: for a production batch, which raw-material lots it used.
--   gudang_ref: Gudang One (warehouse app) issue-note / material-lot reference.
create table batches (
  id                 uuid primary key default gen_random_uuid(),
  factory_id         uuid references factories(id) on delete set null,
  batch_no           text not null,
  batch_type         text not null default 'production_batch'
                       check (batch_type in ('incoming_lot','production_batch')),
  product_id         uuid references products(id) on delete set null,
  material_name      text,                     -- for incoming lots without a product record
  supplier_id        uuid references suppliers(id) on delete set null,  -- incoming lots
  production_date    date,
  line               text,
  shift              text,
  status             text not null default 'released'
                       check (status in ('released','hold','returned','rejected','downgraded')),
  status_reason      text,
  status_changed_by  uuid references profiles(id) on delete set null,
  status_changed_at  timestamptz,
  parent_batch_ids   jsonb not null default '[]'::jsonb,  -- [uuid,...] raw lots consumed
  gudang_ref         text,                     -- Gudang One issue-note / lot no
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (factory_id, batch_no)
);
create index idx_batches_status   on batches(status);
create index idx_batches_product  on batches(product_id);
create index idx_batches_supplier on batches(supplier_id);
create index idx_batches_type     on batches(batch_type);
create index idx_batches_parents  on batches using gin (parent_batch_ids);

-- inspections: header. inspection_no auto-numbered QC-YYYYMMDD-NNN.
--   status includes 'partial' (field items in, micro/outsourced pending).
create table inspections (
  id             uuid primary key default gen_random_uuid(),
  factory_id     uuid references factories(id) on delete set null,
  inspection_no  text unique,                  -- set by trigger
  template_id    uuid references inspection_templates(id) on delete set null,
  batch_id       uuid references batches(id) on delete set null,
  stage          text references inspection_stages(code) on delete set null,
  customer_id    uuid references customers(id) on delete set null,  -- judge by customer spec
  status         text not null default 'draft'
                   check (status in ('draft','partial','submitted','reviewed','approved','rejected')),
  overall_result text
                   check (overall_result is null or overall_result in ('pass','fail','conditional')),
  is_practice    boolean not null default false,  -- practice mode (does not count)
  opened_by      uuid references profiles(id) on delete set null,
  opened_at      timestamptz not null default now(),
  reviewed_by    uuid references profiles(id) on delete set null,
  reviewed_at    timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_inspections_status  on inspections(status);
create index idx_inspections_batch   on inspections(batch_id);
create index idx_inspections_opened  on inspections(opened_by);
create index idx_inspections_stage   on inspections(stage);
create index idx_inspections_date    on inspections(opened_at);

-- inspection_results: detail rows. Multi-sample values + multi-source intake.
--   spec_id locks the spec version used to judge this result (audit key).
--   tested_by/tested_at: each item records who tested it (multi-person split).
--   sample_values: JSONB array of raw per-sample readings (SPC gold data).
--   entry_source + source_ref: the universal intake socket (manual now; excel /
--     instrument / lab / api later without schema change).
create table inspection_results (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  test_item_id  uuid not null references test_items(id) on delete restrict,
  spec_id       uuid references product_specs(id) on delete set null,  -- locked spec version
  sample_values jsonb,                          -- [4.2,4.3,4.1,...] raw per-sample
  value_numeric numeric,                        -- representative value (avg for multi-sample)
  value_bool    boolean,                        -- pass_fail
  value_option  text,                           -- select
  value_text    text,                           -- text
  judgment      text not null default 'na'
                  check (judgment in ('pass','fail','na')),
  photo_urls    jsonb not null default '[]'::jsonb,
  entry_source  text not null default 'manual'
                  check (entry_source in ('manual','excel_import','instrument','lab_import','api')),
  source_ref    jsonb,                          -- {file, instrument_id, external_no, ...}
  tested_by     uuid references profiles(id) on delete set null,
  tested_at     timestamptz,
  remark        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (inspection_id, test_item_id)
);
create index idx_results_inspection on inspection_results(inspection_id);
create index idx_results_item        on inspection_results(test_item_id);
create index idx_results_judgment    on inspection_results(judgment);
create index idx_results_source      on inspection_results(entry_source);

-- ncr_records: non-conformance / disposition. ncr_no auto NCR-YYYYMMDD-NN.
create table ncr_records (
  id                 uuid primary key default gen_random_uuid(),
  factory_id         uuid references factories(id) on delete set null,
  ncr_no             text unique,               -- set by trigger
  inspection_id      uuid references inspections(id) on delete set null,
  batch_id           uuid references batches(id) on delete set null,
  source             text not null default 'in_process'
                       check (source in ('incoming','in_process','final','customer')),
  description        text,
  severity           text not null default 'minor'
                       check (severity in ('minor','major','critical')),
  disposition        text
                       check (disposition is null or disposition in
                         ('release','rework','reject','hold','downgrade','return_to_supplier','sorting','concession')),
  is_ccp             boolean not null default false,  -- CCP-linked: release limited to manager+
  root_cause         text,
  corrective_action  text,
  preventive_action  text,
  reinspection_id    uuid references inspections(id) on delete set null,  -- re-check after rework/replacement
  decided_by         uuid references profiles(id) on delete set null,
  decided_at         timestamptz,
  status             text not null default 'open'
                       check (status in ('open','in_progress','closed')),
  created_by         uuid references profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_ncr_status on ncr_records(status);
create index idx_ncr_batch  on ncr_records(batch_id);
create index idx_ncr_source on ncr_records(source);

-- supplier_returns: raw-material end. return_no auto RET-YYYYMMDD-NN.
create table supplier_returns (
  id                   uuid primary key default gen_random_uuid(),
  factory_id           uuid references factories(id) on delete set null,
  return_no            text unique,             -- set by trigger
  ncr_id               uuid references ncr_records(id) on delete set null,
  batch_id             uuid references batches(id) on delete set null,
  supplier_id          uuid references suppliers(id) on delete set null,
  material_name        text,
  quantity             numeric,
  unit                 text,
  reason               text,
  photos               jsonb not null default '[]'::jsonb,
  returned_at          date,
  supplier_response    text,
  replacement_batch_id uuid references batches(id) on delete set null,  -- triggers re-inspection
  status               text not null default 'pending'
                         check (status in ('pending','returned','replaced','credited','closed')),
  created_by           uuid references profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index idx_returns_supplier on supplier_returns(supplier_id);
create index idx_returns_status   on supplier_returns(status);

-- customer_complaints: finished-goods end. complaint_no auto CMP-YYYYMMDD-NN.
create table customer_complaints (
  id              uuid primary key default gen_random_uuid(),
  factory_id      uuid references factories(id) on delete set null,
  complaint_no    text unique,                  -- set by trigger
  customer_id     uuid references customers(id) on delete set null,
  customer_name   text,                          -- free text fallback
  product_id      uuid references products(id) on delete set null,
  batch_id        uuid references batches(id) on delete set null,   -- reverse-trace entry
  complaint_type  text not null default 'quality'
                    check (complaint_type in ('quality','foreign_matter','packaging','shelf_life','delivery','other')),
  description     text,
  photos          jsonb not null default '[]'::jsonb,
  received_at     date,
  returned_qty    numeric,
  reinspection_id uuid references inspections(id) on delete set null,  -- returned-goods re-check
  responsibility  text
                    check (responsibility is null or responsibility in
                      ('manufacturing','transport','storage','customer_side','not_confirmed')),
  disposition     text
                    check (disposition is null or disposition in ('replace','credit','reject_claim','scrap')),
  capa            text,
  handled_by      uuid references profiles(id) on delete set null,
  closed_at       timestamptz,
  status          text not null default 'open'
                    check (status in ('open','investigating','closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_complaints_status   on customer_complaints(status);
create index idx_complaints_customer on customer_complaints(customer_id);
create index idx_complaints_batch    on customer_complaints(batch_id);

-- export_logs: output audit trail (ch.6.3). Every export leaves a trace.
create table export_logs (
  id           uuid primary key default gen_random_uuid(),
  factory_id   uuid references factories(id) on delete set null,
  doc_type     text not null,                   -- 'coa' | 'batch_trace' | 'monthly_report' | ...
  audience     text not null
                 check (audience in ('internal','regulator','customer')),
  customer_id  uuid references customers(id) on delete set null,  -- when audience='customer'
  data_scope   jsonb not null default '{}'::jsonb,  -- filters / batch ids / date range exported
  file_hash    text,                            -- sha256 of generated file (leak tracing)
  file_url     text,
  serial_no    text,                            -- printed document serial
  exported_by  uuid references profiles(id) on delete set null,
  exported_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_exportlogs_audience on export_logs(audience);
create index idx_exportlogs_by       on export_logs(exported_by);
create index idx_exportlogs_at       on export_logs(exported_at);

-- ============================================================================
-- AUTO-NUMBER TRIGGERS
-- ----------------------------------------------------------------------------
-- Each fills its *_no on INSERT if null, using qc_next_seq (concurrency-safe).
-- Formats:
--   inspections.inspection_no  QC-YYYYMMDD-NNN   (3-digit, daily)
--   ncr_records.ncr_no         NCR-YYYYMMDD-NN
--   supplier_returns.return_no RET-YYYYMMDD-NN
--   customer_complaints        CMP-YYYYMMDD-NN
-- ============================================================================

create or replace function qc_gen_inspection_no()
returns trigger language plpgsql as $$
declare d date := current_date;
begin
  if new.inspection_no is null then
    new.inspection_no := 'QC-' || to_char(d,'YYYYMMDD') || '-' ||
                         lpad(qc_next_seq('QC', d)::text, 3, '0');
  end if;
  return new;
end; $$;
create trigger trg_inspection_no before insert on inspections
  for each row execute function qc_gen_inspection_no();

create or replace function qc_gen_ncr_no()
returns trigger language plpgsql as $$
declare d date := current_date;
begin
  if new.ncr_no is null then
    new.ncr_no := 'NCR-' || to_char(d,'YYYYMMDD') || '-' ||
                  lpad(qc_next_seq('NCR', d)::text, 2, '0');
  end if;
  return new;
end; $$;
create trigger trg_ncr_no before insert on ncr_records
  for each row execute function qc_gen_ncr_no();

create or replace function qc_gen_return_no()
returns trigger language plpgsql as $$
declare d date := current_date;
begin
  if new.return_no is null then
    new.return_no := 'RET-' || to_char(d,'YYYYMMDD') || '-' ||
                     lpad(qc_next_seq('RET', d)::text, 2, '0');
  end if;
  return new;
end; $$;
create trigger trg_return_no before insert on supplier_returns
  for each row execute function qc_gen_return_no();

create or replace function qc_gen_complaint_no()
returns trigger language plpgsql as $$
declare d date := current_date;
begin
  if new.complaint_no is null then
    new.complaint_no := 'CMP-' || to_char(d,'YYYYMMDD') || '-' ||
                        lpad(qc_next_seq('CMP', d)::text, 2, '0');
  end if;
  return new;
end; $$;
create trigger trg_complaint_no before insert on customer_complaints
  for each row execute function qc_gen_complaint_no();

-- ============================================================================
-- updated_at TRIGGERS (attach qc_set_updated_at to every table with the column)
-- ============================================================================
create trigger trg_updated_factories          before update on factories           for each row execute function qc_set_updated_at();
create trigger trg_updated_profiles            before update on profiles             for each row execute function qc_set_updated_at();
create trigger trg_updated_customers           before update on customers            for each row execute function qc_set_updated_at();
create trigger trg_updated_products            before update on products             for each row execute function qc_set_updated_at();
create trigger trg_updated_suppliers           before update on suppliers            for each row execute function qc_set_updated_at();
create trigger trg_updated_test_items          before update on test_items           for each row execute function qc_set_updated_at();
create trigger trg_updated_stages              before update on inspection_stages    for each row execute function qc_set_updated_at();
create trigger trg_updated_specs               before update on product_specs        for each row execute function qc_set_updated_at();
create trigger trg_updated_templates           before update on inspection_templates for each row execute function qc_set_updated_at();
create trigger trg_updated_template_items      before update on template_items       for each row execute function qc_set_updated_at();
create trigger trg_updated_refdocs             before update on reference_documents  for each row execute function qc_set_updated_at();
create trigger trg_updated_instruments         before update on instruments          for each row execute function qc_set_updated_at();
create trigger trg_updated_batches             before update on batches              for each row execute function qc_set_updated_at();
create trigger trg_updated_inspections         before update on inspections          for each row execute function qc_set_updated_at();
create trigger trg_updated_results             before update on inspection_results   for each row execute function qc_set_updated_at();
create trigger trg_updated_ncr                 before update on ncr_records          for each row execute function qc_set_updated_at();
create trigger trg_updated_returns             before update on supplier_returns     for each row execute function qc_set_updated_at();
create trigger trg_updated_complaints          before update on customer_complaints  for each row execute function qc_set_updated_at();
create trigger trg_updated_exportlogs          before update on export_logs          for each row execute function qc_set_updated_at();

-- ============================================================================
-- END schema.sql
-- ============================================================================
