// ============================================================================
// FQMS — Food Quality Management System — domain types
// ----------------------------------------------------------------------------
// Hand-aligned, column-for-column, with qc/supabase/schema.sql. Enum-like
// columns are `text + CHECK` in the DB; here they are string-literal unions so
// the compiler catches an out-of-range value before it ever hits PostgREST.
// Label maps live at the bottom — three languages (zh/en/id), Bahasa primary
// for shop-floor labels, mirroring the FAMMS convention.
// ============================================================================

export type Locale = 'zh' | 'en' | 'id'

// ---- Enums (must match schema.sql CHECK constraints exactly) ---------------

export type UserRole = 'inspector' | 'supervisor' | 'manager' | 'admin'
export type PreferredLanguage = 'id' | 'zh' | 'en'
export type CoaLanguage = 'en' | 'id'

export type ProductCategory =
  | 'nata_de_coco'
  | 'tapioca_pearl'
  | 'syrup'
  | 'raw_material'
  | 'packaging'
  | 'other'

export type TestItemCategory =
  | 'sensory'
  | 'physical'
  | 'chemical'
  | 'micro'
  | 'packaging'
  | 'hygiene'

export type ResultType = 'numeric' | 'pass_fail' | 'select' | 'text'

export type Sensitivity = 'public' | 'internal' | 'confidential'

export type JudgmentMode = 'average' | 'each_sample'

export type StageCode =
  | 'incoming'
  | 'in_process'
  | 'final'
  | 'water'
  | 'environment'
  | 'hygiene'
  | 're_inspection'
  | (string & {}) // stages are configurable data — allow unknown seeded codes

export type BatchType = 'incoming_lot' | 'production_batch'

export type BatchStatus =
  | 'released'
  | 'hold'
  | 'returned'
  | 'rejected'
  | 'downgraded'

export type InspectionStatus =
  | 'draft'
  | 'partial'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected'

export type OverallResult = 'pass' | 'fail' | 'conditional'

export type Judgment = 'pass' | 'fail' | 'na'

export type EntrySource =
  | 'manual'
  | 'excel_import'
  | 'instrument'
  | 'lab_import'
  | 'api'

export type NcrSource = 'incoming' | 'in_process' | 'final' | 'customer'
export type NcrSeverity = 'minor' | 'major' | 'critical'
export type NcrDisposition =
  | 'release'
  | 'rework'
  | 'reject'
  | 'hold'
  | 'downgrade'
  | 'return_to_supplier'
  | 'sorting'
  | 'concession'
export type NcrStatus = 'open' | 'in_progress' | 'closed'

export type SupplierReturnStatus =
  | 'pending'
  | 'returned'
  | 'replaced'
  | 'credited'
  | 'closed'

export type ComplaintType =
  | 'quality'
  | 'foreign_matter'
  | 'packaging'
  | 'shelf_life'
  | 'delivery'
  | 'other'
export type ComplaintResponsibility =
  | 'manufacturing'
  | 'transport'
  | 'storage'
  | 'customer_side'
  | 'not_confirmed'
export type ComplaintDisposition = 'replace' | 'credit' | 'reject_claim' | 'scrap'
export type ComplaintStatus = 'open' | 'investigating' | 'closed'

export type ReferenceDocType =
  | 'sni_standard'
  | 'bpom_regulation'
  | 'internal_sop'
  | 'customer_spec'
  | 'limit_sample_photo'
  | 'defect_photo'
  | 'other'

export type ExportAudience = 'internal' | 'regulator' | 'customer'

// ---- Row shapes ------------------------------------------------------------

export interface Factory {
  id: string
  code: string
  name: string
  address: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  factory_id: string | null
  full_name: string
  role: UserRole
  pin_code: string | null
  preferred_language: PreferredLanguage
  phone: string | null
  telegram_chat_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  factory_id: string | null
  code: string | null
  name: string
  country: string | null
  contact: string | null
  coa_language: CoaLanguage
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  factory_id: string | null
  product_code: string
  name_id: string
  name_zh: string | null
  name_en: string | null
  category: ProductCategory
  md_number: string | null
  halal_cert_no: string | null
  halal_expiry: string | null
  shelf_life_days: number | null
  storage_condition: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  factory_id: string | null
  code: string | null
  name: string
  material_types: string | null
  contact: string | null
  halal_cert_no: string | null
  halal_expiry: string | null
  rating: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TestItem {
  id: string
  item_code: string
  name_id: string
  name_zh: string | null
  name_en: string | null
  category: TestItemCategory
  result_type: ResultType
  unit: string | null
  select_options: string[] | null
  test_method: string | null
  is_external: boolean
  sensitivity: Sensitivity
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InspectionStage {
  id: string
  code: string
  name_id: string
  name_zh: string | null
  name_en: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductSpec {
  id: string
  product_id: string
  test_item_id: string
  customer_id: string | null // NULL = generic spec
  stage: StageCode
  spec_min: number | null
  spec_max: number | null
  spec_target: number | null
  spec_text: string | null
  sample_count: number
  judgment_mode: JudgmentMode
  is_mandatory: boolean
  is_ccp: boolean
  regulation_ref: string | null
  version: number
  effective_from: string
  effective_to: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface InspectionTemplate {
  id: string
  factory_id: string | null
  template_name: string
  product_id: string
  stage: StageCode
  sampling_note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateItem {
  id: string
  template_id: string
  test_item_id: string
  sort_order: number
  default_value: string | null
  created_at: string
  updated_at: string
}

export interface ReferenceDocument {
  id: string
  factory_id: string | null
  title: string
  doc_type: ReferenceDocType
  file_url: string | null
  linked_test_items: string[]
  linked_products: string[]
  version: number
  effective_from: string
  effective_to: string | null
  uploaded_by: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Instrument {
  id: string
  factory_id: string | null
  code: string | null
  name: string
  serial_no: string | null
  location: string | null
  last_calibrated: string | null
  next_due: string | null
  cert_no: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Batch {
  id: string
  factory_id: string | null
  batch_no: string
  batch_type: BatchType
  product_id: string | null
  material_name: string | null
  supplier_id: string | null
  production_date: string | null
  line: string | null
  shift: string | null
  status: BatchStatus
  status_reason: string | null
  status_changed_by: string | null
  status_changed_at: string | null
  parent_batch_ids: string[]
  gudang_ref: string | null
  /** Structured Gudang One link, set when pulled via "Ambil dari Gudang" lookup. */
  gudang_meta: { gudang_batch_id: string; lot_no: string; warehouse: string } | null
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  factory_id: string | null
  inspection_no: string | null
  template_id: string | null
  batch_id: string | null
  stage: StageCode | null
  customer_id: string | null
  status: InspectionStatus
  overall_result: OverallResult | null
  is_practice: boolean
  opened_by: string | null
  opened_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InspectionResult {
  id: string
  inspection_id: string
  test_item_id: string
  spec_id: string | null
  sample_values: number[] | null
  value_numeric: number | null
  value_bool: boolean | null
  value_option: string | null
  value_text: string | null
  judgment: Judgment
  photo_urls: string[]
  entry_source: EntrySource
  source_ref: Record<string, unknown> | null
  tested_by: string | null
  tested_at: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface NcrRecord {
  id: string
  factory_id: string | null
  ncr_no: string | null
  inspection_id: string | null
  batch_id: string | null
  source: NcrSource
  description: string | null
  severity: NcrSeverity
  disposition: NcrDisposition | null
  is_ccp: boolean
  root_cause: string | null
  corrective_action: string | null
  preventive_action: string | null
  reinspection_id: string | null
  decided_by: string | null
  decided_at: string | null
  status: NcrStatus
  /** Optional suspected-equipment code; collected for a future FAMMS work-order link (Phase 2). */
  machine_code: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SupplierReturn {
  id: string
  factory_id: string | null
  return_no: string | null
  ncr_id: string | null
  batch_id: string | null
  supplier_id: string | null
  material_name: string | null
  quantity: number | null
  unit: string | null
  reason: string | null
  photos: string[]
  returned_at: string | null
  supplier_response: string | null
  replacement_batch_id: string | null
  status: SupplierReturnStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CustomerComplaint {
  id: string
  factory_id: string | null
  complaint_no: string | null
  customer_id: string | null
  customer_name: string | null
  product_id: string | null
  batch_id: string | null
  complaint_type: ComplaintType
  description: string | null
  photos: string[]
  received_at: string | null
  returned_qty: number | null
  reinspection_id: string | null
  responsibility: ComplaintResponsibility | null
  disposition: ComplaintDisposition | null
  capa: string | null
  handled_by: string | null
  closed_at: string | null
  status: ComplaintStatus
  created_at: string
  updated_at: string
}

export interface ExportLog {
  id: string
  factory_id: string | null
  doc_type: string
  audience: ExportAudience
  customer_id: string | null
  data_scope: Record<string, unknown>
  file_hash: string | null
  file_url: string | null
  serial_no: string | null
  exported_by: string | null
  exported_at: string
  created_at: string
  updated_at: string
}

// ---- Status / semantic colors (ch.5.6 — single source, matches FAMMS) ------
// pass/done = green, fail/overdue = red, pending = blue, warning/review = orange

export const SEMANTIC_COLORS = {
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
  orange: '#ea580c',
  gray: '#6b7280',
} as const

// Tailwind class bundles for status chips / left color bars.
export const JUDGMENT_STYLES: Record<Judgment, { text: string; bg: string; bar: string }> = {
  pass: { text: 'text-green-700', bg: 'bg-green-50', bar: 'bg-green-600' },
  fail: { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-600' },
  na: { text: 'text-gray-500', bg: 'bg-gray-50', bar: 'bg-gray-300' },
}

export const BATCH_STATUS_STYLES: Record<BatchStatus, { text: string; bg: string; bar: string }> = {
  released: { text: 'text-green-700', bg: 'bg-green-50', bar: 'bg-green-600' },
  hold: { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' },
  returned: { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-600' },
  rejected: { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-600' },
  downgraded: { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' },
}

export const INSPECTION_STATUS_STYLES: Record<InspectionStatus, { text: string; bg: string; bar: string }> = {
  draft: { text: 'text-gray-600', bg: 'bg-gray-50', bar: 'bg-gray-400' },
  partial: { text: 'text-blue-700', bg: 'bg-blue-50', bar: 'bg-blue-600' },
  submitted: { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500' },
  reviewed: { text: 'text-blue-700', bg: 'bg-blue-50', bar: 'bg-blue-600' },
  approved: { text: 'text-green-700', bg: 'bg-green-50', bar: 'bg-green-600' },
  rejected: { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-600' },
}

// ---- Trilingual label maps -------------------------------------------------
// Bahasa Indonesia primary for shop-floor terms; technical terms kept English.

type L = Record<Locale, string>

export const ROLE_LABELS: Record<UserRole, L> = {
  inspector: { zh: '檢驗員', en: 'Inspector', id: 'Petugas QC' },
  supervisor: { zh: 'QC主管', en: 'QC Supervisor', id: 'Supervisor QC' },
  manager: { zh: 'QA/廠長', en: 'Manager', id: 'Manager' },
  admin: { zh: '管理員', en: 'Admin', id: 'Admin' },
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, L> = {
  nata_de_coco: { zh: '椰果 Nata de Coco', en: 'Nata de Coco', id: 'Nata de Coco' },
  tapioca_pearl: { zh: '珍珠 Tapioca Pearl', en: 'Tapioca Pearl', id: 'Mutiara Tapioka' },
  syrup: { zh: '糖漿 Syrup', en: 'Syrup', id: 'Sirup' },
  raw_material: { zh: '原料 Raw Material', en: 'Raw Material', id: 'Bahan Baku' },
  packaging: { zh: '包材 Packaging', en: 'Packaging', id: 'Kemasan' },
  other: { zh: '其他', en: 'Other', id: 'Lainnya' },
}

export const TEST_ITEM_CATEGORY_LABELS: Record<TestItemCategory, L> = {
  sensory: { zh: '感官', en: 'Sensory', id: 'Organoleptik' },
  physical: { zh: '物理', en: 'Physical', id: 'Fisik' },
  chemical: { zh: '化學', en: 'Chemical', id: 'Kimia' },
  micro: { zh: '微生物', en: 'Microbiology', id: 'Mikrobiologi' },
  packaging: { zh: '包裝/標示', en: 'Packaging', id: 'Kemasan' },
  hygiene: { zh: '人員衛生', en: 'Hygiene', id: 'Higiene' },
}

export const RESULT_TYPE_LABELS: Record<ResultType, L> = {
  numeric: { zh: '數值', en: 'Numeric', id: 'Angka' },
  pass_fail: { zh: '合格/不合格', en: 'Pass / Fail', id: 'Lulus / Gagal' },
  select: { zh: '選項', en: 'Select', id: 'Pilihan' },
  text: { zh: '文字', en: 'Text', id: 'Teks' },
}

export const SENSITIVITY_LABELS: Record<Sensitivity, L> = {
  public: { zh: '公開', en: 'Public', id: 'Publik' },
  internal: { zh: '內部', en: 'Internal', id: 'Internal' },
  confidential: { zh: '機密', en: 'Confidential', id: 'Rahasia' },
}

export const JUDGMENT_MODE_LABELS: Record<JudgmentMode, L> = {
  average: { zh: '平均判定', en: 'Average', id: 'Rata-rata' },
  each_sample: { zh: '逐樣品判定', en: 'Each sample', id: 'Tiap sampel' },
}

export const STAGE_LABELS: Record<string, L> = {
  incoming: { zh: '進料檢驗 IQC', en: 'Incoming (IQC)', id: 'Bahan Masuk (IQC)' },
  in_process: { zh: '製程檢驗 IPQC', en: 'In-process (IPQC)', id: 'Proses (IPQC)' },
  final: { zh: '成品檢驗 FQC', en: 'Final (FQC)', id: 'Produk Jadi (FQC)' },
  water: { zh: '水質檢驗', en: 'Water', id: 'Air' },
  environment: { zh: '環境監測', en: 'Environment', id: 'Lingkungan' },
  hygiene: { zh: '人員衛生', en: 'Hygiene', id: 'Higiene' },
  re_inspection: { zh: '退貨再檢', en: 'Re-inspection', id: 'Pemeriksaan Ulang' },
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, L> = {
  released: { zh: '正常', en: 'Released', id: 'Normal' },
  hold: { zh: '暫扣', en: 'Hold', id: 'Ditahan' },
  returned: { zh: '退貨', en: 'Returned', id: 'Diretur' },
  rejected: { zh: '報廢', en: 'Rejected', id: 'Ditolak' },
  downgraded: { zh: '降級', en: 'Downgraded', id: 'Diturunkan' },
}

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, L> = {
  draft: { zh: '草稿', en: 'Draft', id: 'Draf' },
  partial: { zh: '部分完成', en: 'Partial', id: 'Sebagian' },
  submitted: { zh: '已送出', en: 'Submitted', id: 'Terkirim' },
  reviewed: { zh: '已覆核', en: 'Reviewed', id: 'Ditinjau' },
  approved: { zh: '已核准', en: 'Approved', id: 'Disetujui' },
  rejected: { zh: '已退回', en: 'Rejected', id: 'Ditolak' },
}

export const OVERALL_RESULT_LABELS: Record<OverallResult, L> = {
  pass: { zh: '合格', en: 'Pass', id: 'Lulus' },
  fail: { zh: '不合格', en: 'Fail', id: 'Gagal' },
  conditional: { zh: '有條件放行', en: 'Conditional', id: 'Bersyarat' },
}

export const JUDGMENT_LABELS: Record<Judgment, L> = {
  pass: { zh: '合格', en: 'Pass', id: 'Lulus' },
  fail: { zh: '不合格', en: 'Fail', id: 'Gagal' },
  na: { zh: '不適用', en: 'N/A', id: 'T/A' },
}

export const COA_LANGUAGE_LABELS: Record<CoaLanguage, L> = {
  en: { zh: '英文', en: 'English', id: 'Inggris' },
  id: { zh: '印尼文', en: 'Indonesian', id: 'Bahasa Indonesia' },
}

// Pick a localized product name (falls back to Bahasa, then any).
export function productName(p: Pick<Product, 'name_id' | 'name_zh' | 'name_en'>, locale: Locale): string {
  if (locale === 'zh') return p.name_zh || p.name_id || p.name_en || ''
  if (locale === 'en') return p.name_en || p.name_id || p.name_zh || ''
  return p.name_id || p.name_en || p.name_zh || ''
}

// Pick a localized test-item name.
export function testItemName(t: Pick<TestItem, 'name_id' | 'name_zh' | 'name_en'>, locale: Locale): string {
  if (locale === 'zh') return t.name_zh || t.name_id || t.name_en || ''
  if (locale === 'en') return t.name_en || t.name_id || t.name_zh || ''
  return t.name_id || t.name_en || t.name_zh || ''
}

// Resolve a trilingual label map to the active locale (Bahasa fallback).
export function label(map: L, locale: Locale): string {
  return map[locale] || map.id || map.en
}
