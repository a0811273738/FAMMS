# POS Pro 印尼版 — 開發交接企劃書

> **這份文件的目的**：讓任何 AI 模型或工程師讀完後，能無縫接手繼續開發，不需要重問業主任何已決定的事。
> 最後更新：2026-07-06。業主聯絡語言：繁體中文。

---

## 1. 專案背景與商業目標

- **產品**：POS Pro v2.5.0 — 既有的繁體中文離線優先 POS 系統（本 repo 即完整原始碼）
- **業主目標**：翻譯＋改造後，在**印尼**以買斷制銷售給 **warung**（雜貨店/小吃攤）與 **rumah makan**（家常餐館）
- **銷售通路**：Shopee 印尼站（數位商品）＋ Instagram/TikTok ＋ 在地業務地推
- **交付形式**：**PWA**（手機/平板瀏覽器「加入主畫面」安裝），**不上架** App Store / Play Store。Windows Electron 版保留但非印尼市場重點
- **商業模式**：
  - 軟體買斷 Rp 399.000–499.000（一組啟用碼綁 2 台裝置）
  - 雲端同步加購 Rp 50.000/月 或 Rp 400.000/年（用現有 Supabase 同步功能）
  - 硬體套組代購（平板＋藍牙出單機）賺 15–20% 價差
- **銷售文件已完成**：見 `docs/sales/`（銷售計劃、三語安裝教學、業務話術）。教學內的 `【你的網址】`/`【YOUR-URL】` 等佔位符待部署後替換

## 2. 核心設計哲學（接手模型必讀）

1. **Ponytail 原則**：最懶可行解。不串金流 API、不上架商店、不做 KDS、不接外送平台 — 這些都是「等客人要求再說」。每個功能問「不做會不會賣不掉？」不會就跳過
2. **一套程式碼**：不做多個語言版本的分支、不做 warung/餐館兩個 App。差異全部用「語言切換」和「簡單/完整模式開關」解決。銷售端才包裝成兩個「方案」（Paket Warung / Paket Rumah Makan），軟體是同一個
3. **目標使用者畫像**：印尼小店老闆，可能學歷不高，用 RAM 3–4GB 的便宜 Android 手機，靠圖示/大數字/顏色理解介面而非讀字，什麼都用 WhatsApp。**介面上的每個決定都以這個人為準**
4. **防轉賣是嚇阻不是保險箱**：啟用碼＋裝置綁定，目標是「一般店家懶得繞過」，不追求技術上不可破解

## 3. 現有程式碼架構（已盤點）

- **技術**：React 18 + Vite 5，Electron 33（桌面）、PWA（`public/manifest.webmanifest` + `public/sw.js` 已存在）
- **資料層**：`src/utils/dataAccess.js` 抽象 — Electron 走 better-sqlite3（`electron/database.js`），瀏覽器走 **localStorage**。UI 共用
- **頁面**：`src/pages/` 共 14 頁（POS 收銀、庫存、會員、訂貨、記帳、報表、Dashboard、班別、盤點、廢棄、促銷、設定、登入、訂單）
- **選單**：`src/components/Sidebar.jsx`，16 個項目
- **收銀主頁**：`src/pages/POSPage.jsx` — 注意有「**未開班不能收銀**」的門檻（搜 `openShift`），有 F1/F2/F3 鍵盤快捷鍵（桌面思維）
- **結帳**：`src/components/CartPanel.jsx`（混合付款、目前有現金等方式）
- **掃碼點餐**：`public/menu/`（獨立的 vanilla JS 頁面，客人手機掃 QR 用，已有桌號概念）— 結構簡單，直接翻譯即可
- **雲端同步**：`src/utils/cloudSync.js` + `supabase/schema.sql`（選用，單店 schema 預設關 RLS — 見 README 安全須知）
- **測試**：vitest，76 個測試通過（`npm test`）
- **所有 UI 字串目前寫死繁體中文在 JSX 裡** — 這是第一階段要解決的
- 既有文件：`HANDOFF.md`（原作者的技術交接）、`TESTING_CHECKLIST.md`、`SETUP_SUPABASE.md`、`DEPLOY.md` 都值得先讀

## 4. 開發範圍（按此順序執行，共 4 週）

### Phase 1：i18n 三語化（5–7 天）— 最大項，先做
- 抽出全部 UI 字串到字典檔：建議 `src/i18n/zh.js` / `en.js` / `id.js` + 一個極簡 `t()` helper（**不要**引入 i18next 等大型庫，localStorage 存語言偏好即可 — ponytail）
- 範圍：14 個 pages、所有 components、`public/menu/`（客人看的，優先品質）、Electron 選單
- 語言選擇：首次啟用時選，設定頁可改
- **貨幣**：印尼盾格式 `Rp 15.000`（千分位「.」、無小數）。注意：現有程式碼可能到處硬編 `$` 或 NT 格式，貨幣格式化要集中成一個 util
- **日期**：DD/MM/YYYY
- **價格輸入省千**：印尼口語「15」= Rp 15.000。商品價格輸入時提供「打 15 自動 ×1000」的模式（設定可關）
- 翻譯流程:先機翻＋業主校對，上市前找印尼母語者過一遍 UI（業主已知，預算 USD 30–50）

### Phase 2：簡單模式 Mode Sederhana（4–5 天）— 賣不賣得掉的分水嶺
**預設開啟**簡單模式，設定頁可切「完整模式」（Mode Lengkap）：
- 選單 16 項砍到 5 項：Kasir / Produk / Laporan / Member / Pengaturan（其餘藏進完整模式）
- **移除開班門檻**：簡單模式下自動開班（零用金 0），打開就能賣。完整模式保留原班別管理
- 商品格用**大圖磚**（照片＋大字價格），點擊即加入購物車
- 收現金時顯示**鈔票面額快捷鈕**：Rp 50.000 / 100.000 / Uang Pas（剛好）— 對應印尼常用鈔票
- 主要按鈕 ≥48px 高、價格數字加大
- 報表首頁只留三張大字卡：Omzet（營收）/ Untung（毛利）/ Transaksi（單數）
- **淺色主題**設為簡單模式預設（現在是深色金調）
- 會員儲值/賒帳功能改用印尼詞 **Kasbon**，放明顯位置（warung 賒帳文化是差異化賣點）

### Phase 3：付款與硬體（4–5 天）
- **QRIS**：設定頁上傳老闆自己的 QRIS 收款圖 → 結帳新增 QRIS 付款方式 → 全螢幕顯示圖給客人掃 → 人工按「已收款」。不串金流 API（需印尼法人，跳過）
- **WhatsApp 收據**：結帳完成後「Kirim via WA」按鈕 → `wa.me/<客人號碼>?text=<收據文字>`。零串接
- **外送通路快速入帳**（+半天）：結帳付款方式加 GoFood / GrabFood / ShopeeFood 三個選項（外送單到了店員在 POS 照樣入一單、庫存照扣），報表加通路別分析。**不串外送平台 API**（商家 API 不開放，需印尼法人＋簽約）— 店家用平台自己的商家 App 接單，POS 只負責統一記帳。業主已確認此做法（2026-07-07）
- **藍牙熱感出單機 58mm**（Web Bluetooth + ESC/POS，僅 Android Chrome）：
  - 收銀收據＋**廚房單**（桌號、品項、備註、大字）— 廚房單是 rumah makan 的成敗關鍵
  - 參考 `electron/printer.js` 已有的 ESC/POS 邏輯可移植
  - 目標機型：印尼蝦皮熱賣的便宜機（EPPOS、Panda PRJ-58D 級別），業主會買實機測試；只承諾支援實測過的機型
  - iOS 不支援 Web Bluetooth → 明講不支援 iPhone 列印（印尼 Android 市占 ~90%）

### Phase 4：啟用碼 + 部署（3–4 天）
- Supabase `licenses` 表：code、訂單編號、綁定裝置 ID（最多 2）、狀態、啟用日期
- 流程：首次開啟需網路 → 輸入啟用碼 → 驗證＋綁定（裝置 ID 存 localStorage）→ 之後全離線，只查本機旗標
- 第 3 台裝置啟用 → 拒絕並顯示客服 WhatsApp
- 後台解綁機制（業主手動操作 Supabase 後台即可，不用做管理介面 — ponytail）
- 預設帳號 `老闆/1234` 改為英/印尼文並強制首次改密
- 部署 Cloudflare Pages＋業主買的短網域；替換 `docs/sales/` 教學內佔位符
- 低階 Android 實機測試＋`TESTING_CHECKLIST.md` 全跑＋三語全頁檢查

## 5. 明確跳過的事（有人提議也不要做，除非業主改主意）
- ❌ 金流 API 串接（QRIS 靜態圖夠用；串 API 要印尼法人）
- ❌ 上架 Google Play / App Store（PWA 夠用）
- ❌ GoFood/GrabFood 串接、廚房顯示螢幕 KDS（等真實客人要求）
- ❌ 多語言多版本分支、warung/餐館兩套 App（一套程式碼＋開關）
- ❌ 程式碼混淆/硬體鎖（成本高於損失）
- ❌ i18next 等重型 i18n 框架（自寫 t() 即可）
- ❌ iOS 藍牙列印

## 6. 驗收標準（每 Phase 完成的定義）
- 全部既有測試繼續通過（`npm test`），新邏輯（t() helper、Rp 格式化、啟用碼驗證、ESC/POS 編碼）各留最小單元測試
- 三語切換後無殘留中文（可 grep JSX 中的 CJK 字元驗證）
- 簡單模式：從打開 App 到完成第一筆現金交易 ≤ 4 次點擊
- 啟用碼：第 3 台裝置被拒的測試案例
- PWA 在 Android Chrome 離線可完整收銀（關網路實測）

## 7. 業主待辦（非程式碼）
- 買短網域、開 Supabase 帳號、開 WhatsApp Business
- 買 1–2 台印尼熱賣藍牙出單機＋一台低階 Android 實測
- 印尼母語者 UI 校對（Fiverr）
- 拍 60 秒安裝影片＋掃碼點餐演示影片、Shopee 上架、IG/TikTok 帳號
- 詳細銷售執行見 `docs/sales/00-產品開發總規劃.md` 與 `01-銷售計劃.md`

## 8. 給接手模型的第一步
1. 讀本文件 + `HANDOFF.md` + `README.md`
2. `npm install && npm test` 確認 76 測試通過、`npm run dev` 看現況介面
3. 從 Phase 1 開始：先建 `src/i18n/` 骨架與 `t()` helper，拿 `LoginScreen.jsx`（最小頁）打樣，業主確認樣式後再批量處理其餘頁面
4. 每個 Phase 完成即 commit + push（分支：`claude/festive-edison-xlmyio`），commit message 註明 Phase 進度
