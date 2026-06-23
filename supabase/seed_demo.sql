-- ============================================================================
-- FAMMS Demo Seed Data (areas + sample machines)
-- Run AFTER schema.sql + seed_fault_tree.sql
-- Lets you test the incident reporting flow with real machines.
-- ============================================================================

-- Areas (linked to factories by code)
INSERT INTO areas (factory_id, name, code, description)
SELECT f.id, a.name, a.code, a.description
FROM (VALUES
  ('SJA', 'Production',  'PROD', 'Area produksi'),
  ('SJA', 'Packing',     'PACK', 'Area packing'),
  ('SJA', 'Utility',     'UTIL', 'Boiler, compressor, chiller'),
  ('DIN', 'Production',  'PROD', 'Area produksi'),
  ('DIN', 'Warehouse',   'WH',   'Gudang'),
  ('OLT', 'Production',  'PROD', 'Area produksi')
) AS a(factory_code, name, code, description)
JOIN factories f ON f.code = a.factory_code
ON CONFLICT (factory_id, code) DO NOTHING;

-- Sample machines
INSERT INTO machines (factory_id, area_id, machine_code, machine_name, brand, model, status)
SELECT f.id, ar.id, m.machine_code, m.machine_name, m.brand, m.model, 'running'
FROM (VALUES
  ('DIN', 'PROD', 'DIN-HMG-001', 'Homogenizer Line 1', 'GEA', 'Ariete 3160'),
  ('DIN', 'PROD', 'DIN-PMP-002', 'Transfer Pump 2',    'Grundfos', 'CRN 15'),
  ('SJA', 'PROD', 'SJA-MIX-001', 'Mixer Tank 1',        'Tetra Pak', 'R-200'),
  ('SJA', 'PACK', 'SJA-FIL-001', 'Filling Machine 1',   'Krones', 'Modulfill'),
  ('SJA', 'UTIL', 'SJA-CMP-001', 'Air Compressor 1',    'Atlas Copco', 'GA 75'),
  ('OLT', 'PROD', 'OLT-CNV-001', 'Conveyor Line 1',     'Interroll', 'EC310')
) AS m(factory_code, area_code, machine_code, machine_name, brand, model)
JOIN factories f ON f.code = m.factory_code
JOIN areas ar ON ar.factory_id = f.id AND ar.code = m.area_code
ON CONFLICT (factory_id, machine_code) DO NOTHING;
