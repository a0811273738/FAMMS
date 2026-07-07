# FQMS — Template Inventarisasi Spesifikasi / 規格盤點範本

Berkas / 檔案: **`spec_inventory_template.xlsx`**

Template ini adalah langkah pertama implementasi FQMS (lihat rencana bab 10 & bab 11 #11).
Tujuannya: mengumpulkan **semua standar pemeriksaan yang tersebar di berbagai formulir kertas**
menjadi **satu tabel induk**, yang nantinya dipakai **langsung sebagai template impor master data** sistem QC.

本範本是 FQMS 導入的第一步 (見規劃書第十章、第十一章第11題)。
用途:把**散在各紙本表單上的所有檢驗標準**集中成**一張總表**,之後**直接作為系統主檔的匯入範本**。

---

## 1. Isi berkas / 檔案內容

| Sheet | 用途 (中文) | Kegunaan (ID) | 對應 schema 資料表 |
|---|---|---|---|
| **📖 Petunjuk 說明** | 雙語填寫說明 | Petunjuk pengisian dwibahasa | — |
| **Produk 產品** | 產品/原料主檔 | Master produk & bahan | `products` |
| **Item Uji 檢驗項目** | 檢驗項目字典 (全廠共用) | Kamus item pemeriksaan | `test_items` |
| **Spesifikasi 規格總表** ★ | 核心:一列=一條標準 | INTI: satu baris = satu standar | `product_specs` |
| **Pelanggan 客戶** | 客戶主檔 (含 CoA 語言) | Master pelanggan | `customers` |
| **Pemasok 供應商** | 供應商主檔 | Master pemasok | `suppliers` |
| **Formulir Lama 舊表單** | 紙本盤點銷帳表 | Pelacakan formulir kertas | — (工作用) |

Nama kolom sengaja disamakan dengan nama field di `qc/supabase/schema.sql`
agar bisa langsung dipetakan saat impor.
欄位名刻意對齊 `qc/supabase/schema.sql` 的欄位名,方便日後直接匯入。

---

## 2. Nilai dropdown (sesuai CHECK constraint schema) / 下拉值 (對齊 schema)

| 欄位 Kolom | 合法值 Nilai valid |
|---|---|
| `Produk.category` | `nata_de_coco` / `tapioca_pearl` / `syrup` / `raw_material` / `packaging` / `other` |
| `Item Uji.category` | `sensory` / `physical` / `chemical` / `micro` / `packaging` / `hygiene` |
| `Item Uji.result_type` | `numeric` / `pass_fail` / `select` / `text` |
| `Spesifikasi.stage` | `incoming` / `in_process` / `final` / `water` / `environment` / `hygiene` / `re_inspection` |
| `Spesifikasi.judgment_mode` | `average` / `each_sample` |
| `coa_language` | `en` / `id` |
| `is_*` / `transcribed` | `Y` / `N` |

> Catatan / 注意: `Item Uji.category` mengikuti CHECK di schema (`test_items.category`) yang
> **tidak** memuat `water`/`environment` — keduanya adalah **tahap (stage)**, bukan kategori item.
> Jadi `water`/`environment` hanya muncul di dropdown `Spesifikasi.stage`.
> 檢驗項目類別依 schema 的 `test_items.category` CHECK,**不含** `water`/`environment` (它們是**階段**,不是項目類別),
> 故 `water`/`environment` 只出現在規格總表的 `stage` 下拉。

---

## 3. Aturan pengisian penting / 重要填寫規則

- Baris **abu-abu** = contoh, **hapus sebelum impor**. / **灰底列 = 範例,匯入前刪除**。
- `result_type` menentukan kolom spec / `result_type` 決定填哪些規格欄:
  - `numeric` → `spec_min` / `spec_max` / `spec_target`
  - `pass_fail` / `select` / `text` → `spec_text` (mis. `不得檢出` / `tidak terdeteksi`)
- `select_options`: pisahkan dengan `|` / 選項用 `|` 分隔 (mis. `正常白|偏黃|異常`).
- `Spesifikasi.customer` kosong = spec umum; diisi = spec khusus pelanggan (override).
  / `customer` 留空=通用規格;填了=該客戶專屬規格 (覆蓋通用)。
- `sample_count` + `judgment_mode`: multi-sampel / 多樣品 (mis. 抽5桶,平均或逐樣品判定)。
- `is_ccp = Y` → HACCP CCP. `regulation_ref` → 依據 (SNI / BPOM / 客戶規格).
- `source_form` → formulir kertas asal / 原紙本表單名 (untuk rekonsiliasi & menemukan konflik standar).
- Tanggal / 日期: `YYYY-MM-DD`.
- Kode (`product_code`, `item_code`) unik & jangan diubah setelah dipakai. / 代碼唯一,勿在使用後修改。

---

## 4. Alur Workshop Inventarisasi Spesifikasi / 規格盤點工作坊流程

Perkiraan / 建議 0.5–1 hari, dipimpin QC Supervisor. / 由 QC 主管主持,約半天至一天。

1. **Kumpulkan bahan / 收齊原料**
   Semua formulir kertas QC yang berlaku + standar SNI/BPOM + spesifikasi pelanggan.
   收齊所有現行紙本 QC 表單 + SNI/BPOM 標準 + 客戶規格書。
2. **Daftarkan formulir / 登錄表單**
   Isi setiap formulir kertas ke sheet **Formulir Lama** (nama, tahap, jumlah item, penanggung jawab).
   把每張紙本填入 **Formulir Lama** (名稱、階段、項數、負責人)。
3. **Bangun kamus item / 建立項目字典**
   Kumpulkan semua item unik lintas formulir ke sheet **Item Uji** (beri `item_code`, tentukan `result_type`).
   把跨表單的所有唯一項目彙整到 **Item Uji** (給 `item_code`、決定 `result_type`)。
4. **Daftarkan produk & pelanggan / 登錄產品與客戶**
   Isi **Produk**, **Pelanggan**, **Pemasok**.
5. **Pindahkan standar / 謄入標準 (INTI / 核心)**
   Untuk tiap produk × tahap × item, tulis satu baris di **Spesifikasi**; catat `source_form`.
   每個 產品×階段×項目 在 **Spesifikasi** 寫一列;記下 `source_form`。
6. **Temukan & satukan konflik / 找出並統一矛盾** ★
   Bila item yang sama punya standar berbeda di formulir berbeda → diskusikan & tetapkan satu standar resmi.
   同一項目在不同表單標準不一 → 討論後定一個官方標準 (制度化的第一課)。
7. **Rekonsiliasi / 銷帳**
   Tandai `transcribed = Y` di **Formulir Lama** setelah semua item formulir itu masuk **Spesifikasi**.
   某表單所有項目都謄入後,在 **Formulir Lama** 標 `transcribed = Y`。
8. **Review & serahkan / 覆核與交付**
   Supervisor tinjau, hapus baris contoh abu-abu, simpan sebagai berkas impor akhir.
   主管覆核,刪除灰底範例列,存檔作為最終匯入檔。

Selesai workshop → berkas ini menjadi **sumber impor master data** (`products` / `test_items` /
`product_specs` / `customers` / `suppliers`).
工作坊完成後 → 本檔即為**主檔匯入來源**。

---

## 5. Regenerasi / 重新生成

Berkas dibuat oleh skrip Node.js + `exceljs`. Bila perlu diubah, sesuaikan skrip build lalu
jalankan ulang & verifikasi (cek jumlah sheet / header / dropdown).
本檔由 Node.js + `exceljs` 腳本生成。如需修改,調整 build 腳本後重跑並驗證 (檢查 sheet 數 / 表頭 / 下拉)。
