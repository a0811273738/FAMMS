-- ============================================================================
-- FQMS — Seed data
-- seed_test_items.sql — run AFTER schema.sql (rls.sql optional before/after)
-- ============================================================================
-- Contents:
--   1. Demo factory
--   2. inspection_stages (7 seed stages, configurable afterwards)
--   3. test_items dictionary (~55 items for Nata de Coco & Tapioca Pearl QC)
--
-- Naming: name_id (Bahasa Indonesia, primary) / name_zh / name_en.
-- test_method references SNI / BPOM / AOAC where sensible.
-- All inserts are idempotent via ON CONFLICT on the natural key.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Demo factory (fixed uuid for reproducible seeds)
-- ----------------------------------------------------------------------------
insert into factories (id, code, name, address, timezone) values
  ('00000000-0000-0000-0000-0000000000f1', 'PLANT1', 'Pabrik Utama (Main Plant)', 'Kawasan Industri, Indonesia', 'Asia/Jakarta')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Inspection stages
-- ----------------------------------------------------------------------------
insert into inspection_stages (code, name_id, name_zh, name_en, sort_order) values
  ('incoming',      'Pemeriksaan Bahan Masuk (IQC)', '進料檢驗', 'Incoming Inspection', 10),
  ('in_process',    'Pemeriksaan Proses (IPQC)',     '製程檢驗', 'In-Process Inspection', 20),
  ('final',         'Pemeriksaan Produk Akhir (FQC)','成品檢驗', 'Final Inspection', 30),
  ('water',         'Pemeriksaan Air',               '水質檢驗', 'Water Quality', 40),
  ('environment',   'Pemantauan Lingkungan',         '環境監測', 'Environmental Monitoring', 50),
  ('hygiene',       'Higiene Personel',              '人員衛生', 'Personnel Hygiene', 60),
  ('re_inspection', 'Pemeriksaan Ulang',             '退貨再檢', 'Re-Inspection', 70)
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 3. test_items dictionary
-- ----------------------------------------------------------------------------

-- ===== SENSORY (Organoleptik) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, select_options, test_method, is_external) values
  ('WARNA_001',   'Warna',        '色澤',       'Color',            'sensory', 'select',    null, '["Normal/Putih","Agak Kuning","Abnormal"]'::jsonb, 'Organoleptik / SNI 01-4317', false),
  ('BAU_001',     'Bau',          '氣味',       'Odor',             'sensory', 'pass_fail', null, null, 'Organoleptik / SNI 01-4317', false),
  ('BENDA_001',   'Benda Asing',  '異物',       'Foreign Matter',   'sensory', 'pass_fail', null, null, 'Organoleptik / CPPOB', false),
  ('TEKSTUR_001', 'Tekstur/Kekenyalan', '口感/咬感', 'Texture/Bite',  'sensory', 'select',    null, '["Kenyal Normal","Terlalu Lembek","Terlalu Keras"]'::jsonb, 'Organoleptik', false),
  ('BENTUK_001',  'Bentuk',       '形狀完整度', 'Shape Integrity',  'sensory', 'select',    null, '["Utuh","Cacat Ringan","Cacat Berat"]'::jsonb, 'Organoleptik', false),
  ('RASA_001',    'Rasa',         '味道',       'Taste',            'sensory', 'pass_fail', null, null, 'Organoleptik', false)
on conflict (item_code) do nothing;

-- ===== PHYSICAL (Fisik) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('PH_001',       'Nilai pH',            'pH值',        'pH Value',            'physical', 'numeric', '',      'pH meter / AOAC 981.12', false),
  ('BRIX_001',     'Kadar Gula (Brix)',   '糖度 Brix',   'Brix',                'physical', 'numeric', '°Brix', 'Refraktometer / AOAC 932.12', false),
  ('UKURAN_001',   'Ukuran Potongan',     '尺寸(丁塊)',  'Piece Size',          'physical', 'numeric', 'mm',    'Jangka sorong / Internal SOP', false),
  ('UKURAN_002',   'Diameter Mutiara',    '珍珠直徑',    'Pearl Diameter',      'physical', 'numeric', 'mm',    'Jangka sorong / Internal SOP', false),
  ('KEKERASAN_001','Kekerasan/Elastisitas','硬度/彈性',  'Hardness/Elasticity', 'physical', 'numeric', 'g',     'Texture analyzer / Internal SOP', false),
  ('DRAINED_001',  'Berat Tiris (Drained)','固形物比',   'Drained Weight Ratio','physical', 'numeric', '%',     'SNI 01-4317', false),
  ('NETTO_001',    'Berat Bersih',        '淨重',        'Net Weight',          'physical', 'numeric', 'g',     'Timbangan / Internal SOP', false),
  ('VACUUM_001',   'Kevakuman',           '真空度',      'Vacuum Level',        'physical', 'numeric', 'cmHg',  'Vacuum gauge / Internal SOP', false),
  ('SEGEL_001',    'Keutuhan Segel',      '封口完整性',  'Seal Integrity',      'physical', 'pass_fail', null,  'Internal SOP', false),
  ('KADAR_AIR_001','Kadar Air',           '水分',        'Moisture Content',    'physical', 'numeric', '%',     'Gravimetri / AOAC 925.10', false)
on conflict (item_code) do nothing;

-- ===== CHEMICAL (Kimia) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('BENZOAT_001',  'Natrium Benzoat',     '苯甲酸鈉',    'Sodium Benzoate',     'chemical', 'numeric', 'mg/kg', 'SNI 01-2894 / HPLC', false),
  ('SORBAT_001',   'Kalium Sorbat',       '山梨酸鉀',    'Potassium Sorbate',   'chemical', 'numeric', 'mg/kg', 'SNI 01-2894 / HPLC', false),
  ('PEMANIS_001',  'Pemanis Buatan (Sakarin)','人工甜味劑','Artificial Sweetener','chemical','numeric','mg/kg', 'SNI / HPLC', false),
  ('PEWARNA_001',  'Pewarna Buatan',      '人工色素',    'Artificial Colorant', 'chemical', 'pass_fail', null,  'SNI / Kromatografi', false),
  ('ASAM_001',     'Residu Asam Asetat',  '醋酸殘留',    'Acetic Acid Residue', 'chemical', 'numeric', '%',     'Titrasi / Internal SOP', false),
  ('PB_001',       'Timbal (Pb)',         '鉛 Pb',       'Lead (Pb)',           'chemical', 'numeric', 'mg/kg', 'AAS / SNI 2354.5', true),
  ('CD_001',       'Kadmium (Cd)',        '鎘 Cd',       'Cadmium (Cd)',        'chemical', 'numeric', 'mg/kg', 'AAS / SNI 2354.5', true),
  ('AS_001',       'Arsen (As)',          '砷 As',       'Arsenic (As)',        'chemical', 'numeric', 'mg/kg', 'AAS / SNI 2354.5', true),
  ('HG_001',       'Merkuri (Hg)',        '汞 Hg',       'Mercury (Hg)',        'chemical', 'numeric', 'mg/kg', 'AAS-Vapor / SNI 2354.6', true)
on conflict (item_code) do nothing;

-- ===== MICROBIOLOGY (Mikrobiologi) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('TPC_001',      'Angka Lempeng Total (ALT/TPC)', '總生菌數 TPC', 'Total Plate Count', 'micro', 'numeric', 'CFU/g',   'SNI 2897:2008 / BPOM', false),
  ('COLI_001',     'Coliform (APM)',      '大腸桿菌群',  'Coliform (MPN)',      'micro', 'numeric', 'APM/g',   'SNI 2897:2008 / BPOM', false),
  ('ECOLI_001',    'Escherichia coli',    '大腸桿菌 E.coli', 'E. coli',         'micro', 'numeric', 'APM/g',   'SNI 2897:2008 / BPOM', false),
  ('KAPANG_001',   'Kapang & Khamir',     '酵母菌與黴菌','Yeast & Mold',        'micro', 'numeric', 'CFU/g',   'SNI 2897:2008', false),
  ('SALM_001',     'Salmonella sp.',      '沙門氏菌',    'Salmonella',          'micro', 'pass_fail', null,    'SNI 2897:2008 / Negatif per 25g', true),
  ('SAUREUS_001',  'Staphylococcus aureus','金黃色葡萄球菌','S. aureus',        'micro', 'numeric', 'CFU/g',   'SNI 2897:2008', false)
on conflict (item_code) do nothing;

-- ===== PACKAGING / LABELLING (Kemasan) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('LABEL_001',    'Label (MD/Halal/Kadaluarsa)', '標籤(MD/Halal/Exp)', 'Label (MD/Halal/Expiry)', 'packaging', 'pass_fail', null, 'BPOM / Internal SOP', false),
  ('SEGELKUAT_001','Kekuatan Segel',      '封口強度',    'Seal Strength',       'packaging', 'numeric', 'N',      'Tensile test / Internal SOP', false),
  ('KEMASAN_001',  'Kondisi Kemasan/Drum','桶身完好',    'Container/Drum Condition','packaging','pass_fail', null,'Visual / Internal SOP', false),
  ('KODE_001',     'Kode Produksi/Tanggal','批號/日期印字','Production Code/Date','packaging', 'pass_fail', null, 'Visual / BPOM', false),
  ('ISI_001',      'Kesesuaian Isi Bersih','淨含量符合',  'Net Content Conformity','packaging','pass_fail', null, 'Timbangan / BPOM', false)
on conflict (item_code) do nothing;

-- ===== WATER QUALITY (Air) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('PH_AIR_001',   'pH Air',              '水質pH',      'Water pH',            'physical', 'numeric', '',        'pH meter / SNI 06-6989.11', false),
  ('KEKERUHAN_001','Kekeruhan (Turbidity)','濁度',       'Turbidity',           'physical', 'numeric', 'NTU',     'Turbidimeter / SNI 06-6989.25', false),
  ('TDS_001',      'Total Padatan Terlarut (TDS)', '溶解固體 TDS', 'Total Dissolved Solids', 'physical', 'numeric', 'ppm', 'TDS meter / SNI', false),
  ('KLORIN_001',   'Sisa Klor',           '餘氯',        'Residual Chlorine',   'chemical', 'numeric', 'mg/L',    'Kolorimetri / SNI 06-6989.76', false),
  ('KESADAHAN_001','Kesadahan',           '硬度',        'Water Hardness',      'chemical', 'numeric', 'mg/L',    'Titrasi EDTA / SNI 06-6989.12', false),
  ('TPC_AIR_001',  'ALT Air',             '水中總生菌',  'Water Total Plate Count','micro', 'numeric', 'CFU/mL',  'SNI 06-4158', false),
  ('COLI_AIR_001', 'Coliform Air',        '水中大腸桿菌群','Water Coliform',     'micro', 'numeric', 'APM/100mL','SNI 06-4158', false),
  ('ECOLI_AIR_001','E. coli Air',         '水中E.coli',  'Water E. coli',       'micro', 'pass_fail', null,      'SNI 06-4158 / 0 per 100mL', false)
on conflict (item_code) do nothing;

-- ===== ENVIRONMENTAL MONITORING (Lingkungan) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('UDARA_001',    'Angka Kuman Udara (Settle Plate)', '空氣落菌', 'Air Settle Plate Count', 'micro', 'numeric', 'CFU/plate', 'Settle plate / Internal SOP', false),
  ('SWAB_MESIN_001','Swab Permukaan Mesin','機台表面拭子','Machine Surface Swab', 'micro', 'numeric', 'CFU/cm²', 'Swab test / Internal SOP', false),
  ('SWAB_COLI_001','Coliform Swab Permukaan','表面拭子大腸桿菌','Surface Swab Coliform', 'micro', 'pass_fail', null, 'Swab test / Internal SOP', false),
  ('SUHU_RUANG_001','Suhu Ruang',         '車間溫度',    'Room Temperature',    'physical', 'numeric', '°C',      'Termometer / Internal SOP', false),
  ('KELEMBABAN_001','Kelembaban Ruang',   '車間濕度',    'Room Humidity',       'physical', 'numeric', '%RH',     'Higrometer / Internal SOP', false)
on conflict (item_code) do nothing;

-- ===== PERSONNEL HYGIENE (Higiene) =====
insert into test_items (item_code, name_id, name_zh, name_en, category, result_type, unit, test_method, is_external) values
  ('SWAB_TANGAN_001','Swab Tangan',       '手部拭子',    'Hand Swab Count',     'hygiene', 'numeric', 'CFU/hand','Swab test / Internal SOP', false),
  ('SWAB_TANGAN_COLI_001','Coliform Swab Tangan','手部拭子大腸桿菌','Hand Swab Coliform','hygiene','pass_fail', null,'Swab test / Internal SOP', false),
  ('APD_001',      'Kelengkapan APD',     '更衣/防護具', 'PPE Compliance',      'hygiene', 'pass_fail', null,    'Visual / CPPOB', false),
  ('CUCITANGAN_001','Pemeriksaan Cuci Tangan','洗手檢查', 'Handwash Check',      'hygiene', 'pass_fail', null,    'Visual / CPPOB', false),
  ('KUKU_001',     'Kuku & Perhiasan',    '指甲/首飾',   'Nails & Jewelry Check','hygiene', 'pass_fail', null,   'Visual / CPPOB', false),
  ('KESEHATAN_001','Kesehatan Personel',  '人員健康',    'Personnel Health',    'hygiene', 'pass_fail', null,    'Visual / CPPOB', false)
on conflict (item_code) do nothing;

-- ============================================================================
-- END seed_test_items.sql
-- ============================================================================
