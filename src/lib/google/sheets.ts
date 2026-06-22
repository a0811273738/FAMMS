import { google } from 'googleapis'

function getAuth() {
  // Vercel stores env vars with literal \n — replace and strip surrounding quotes
  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? ''
  const key = rawKey
    .replace(/^["']|["']$/g, '')  // strip wrapping quotes if any
    .replace(/\\n/g, '\n')         // literal \n → real newline
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

export interface MaterialRecord {
  codeSupplier: string
  codeBB: string
  tglPO: string
  supplier: string
  item: string
  priceExPPN: number | null
  priceIncPPN: number | null
  poQty: number | null
  packing: string
  tab: string
}

export interface MaterialSummary {
  item: string
  tab: string
  tabProduct: string   // parsed from tab name, e.g. "Pati" from "Pati-Kapal"
  tabSupplier: string  // parsed from tab name, e.g. "Kapal" from "Pati-Kapal"
  latestPrice: number | null
  latestPriceExPPN: number | null
  latestDate: string
  latestSupplier: string
  packing: string
  history: Array<{
    date: string
    supplier: string
    priceIncPPN: number | null
    priceExPPN: number | null
    qty: number | null
    packing: string
  }>
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  // Handle formats: "13-Jan-2020", "29-Des-2020", "2020-01-13"
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
    jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10',
    oct: '10', nov: '11', des: '12', dec: '12',
  }
  const match = raw.match(/(\d{1,2})[- ]([a-zA-Z]{3})[- ](\d{4})/)
  if (match) {
    const m = months[match[2].toLowerCase()] ?? '01'
    return new Date(`${match[3]}-${m}-${String(match[1]).padStart(2, '0')}`)
  }
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function parseNumber(raw: string): number | null {
  if (!raw) return null
  // Remove Rp prefix, spaces, then handle dots as thousands separator
  const cleaned = raw.replace(/[Rp\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function oneYearAgo(): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d
}

export async function getAllMaterials(): Promise<MaterialSummary[]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!

  // Get all sheet/tab names
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const tabs = meta.data.sheets?.map(s => s.properties?.title ?? '').filter(Boolean) ?? []

  const cutoff = oneYearAgo()
  const records: MaterialRecord[] = []

  // Read each tab in parallel (batch of 10)
  for (let i = 0; i < tabs.length; i += 10) {
    const batch = tabs.slice(i, i + 10)
    await Promise.all(batch.map(async tab => {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${tab}'!A1:P500`,
        })
        const rows = res.data.values ?? []
        if (rows.length < 2) return

        // Find header row: look for ITEM, TGL, or HARGA keyword in first 5 rows
        const headerKeywords = ['ITEM', 'HARGA', 'TGL', 'SUPPLIER']
        let headerIdx = 0
        for (let r = 0; r < Math.min(5, rows.length); r++) {
          const rowText = rows[r].map((c: unknown) => String(c).toUpperCase()).join(' ')
          if (headerKeywords.some(k => rowText.includes(k))) {
            headerIdx = r
            break
          }
        }
        const headers = rows[headerIdx].map((h: string) => String(h).trim().toUpperCase())

        const col = (name: string) => headers.findIndex(h => h.includes(name))

        const hasItemCol     = col('ITEM') !== -1
        const hasSebelumPPN  = col('SEBELUM') !== -1   // "Harga sebelum ppn"
        const hasSetelahPPN  = col('SETELAH') !== -1   // "Harga setelah ppn"
        const hasHarga       = col('HARGA') !== -1     // plain "Harga"
        const hasOriginal    = col('ORIGINAL') !== -1  // "Original Price Exclude PPN"
        const hasInclude     = col('INCLUDE') !== -1   // "Price Include PPN"

        const iItem     = hasItemCol ? col('ITEM') : -1
        const iSupplier = col('SUPPLIER')
        const iCodeBB   = col('CODE BB') !== -1 ? col('CODE BB') : 1

        // Price excl PPN: prefer "sebelum ppn" → "original price" → "harga" (single)
        const iPriceEx = hasSebelumPPN ? col('SEBELUM')
          : hasOriginal ? col('ORIGINAL')
          : hasHarga ? col('HARGA') : -1

        // Price incl PPN: prefer "setelah ppn" → "include" → same as excl (single harga)
        const iPriceInc = hasSetelahPPN ? col('SETELAH')
          : hasInclude ? col('INCLUDE')
          : hasHarga ? col('HARGA') : -1

        // Qty: try several column name variants
        const iQty = col('QTY PO') !== -1 ? col('QTY PO')
          : col('PO QTY') !== -1 ? col('PO QTY')
          : col('QTY') !== -1 ? col('QTY') : -1

        const iPacking = col('PACKING')

        // Date: prefer TGL PO → TGL KIRIM → first TGL column
        const iTglPO = col('TGL PO') !== -1 ? col('TGL PO')
          : col('TGL KIRIM') !== -1 ? col('TGL KIRIM')
          : col('TGL') !== -1 ? col('TGL') : 0

        const iCodeSupplier = 0

        // For Pati-Kapal style (no ITEM col), derive item name from tab
        const tabItemName = tab.split('-')[0]?.trim() ?? tab

        // Skip tab if no usable price or item info
        if (iPriceEx === -1 && iPriceInc === -1) return
        if (iItem === -1 && !tabItemName) return

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r]
          const item = iItem >= 0 ? String(row[iItem] ?? '').trim() : tabItemName
          if (!item) continue

          const tglRaw = iTglPO >= 0 ? String(row[iTglPO] ?? '') : ''
          const date = parseDate(tglRaw)
          if (date && date < cutoff) continue // skip older than 2 years

          records.push({
            codeSupplier: String(row[iCodeSupplier] ?? ''),
            codeBB: String(row[iCodeBB] ?? ''),
            tglPO: tglRaw,
            supplier: iSupplier >= 0 ? String(row[iSupplier] ?? '') : '',
            item,
            priceExPPN: iPriceEx >= 0 ? parseNumber(String(row[iPriceEx] ?? '')) : null,
            priceIncPPN: iPriceInc >= 0 ? parseNumber(String(row[iPriceInc] ?? '')) : null,
            poQty: iQty >= 0 ? parseNumber(String(row[iQty] ?? '')) : null,
            packing: iPacking >= 0 ? String(row[iPacking] ?? '') : '',
            tab,
          })
        }
      } catch {
        // Skip unreadable tabs
      }
    }))
  }

  // Aggregate by item
  const byItem = new Map<string, MaterialRecord[]>()
  for (const r of records) {
    const key = r.item.toLowerCase().trim()
    if (!byItem.has(key)) byItem.set(key, [])
    byItem.get(key)!.push(r)
  }

  const summaries: MaterialSummary[] = []
  for (const [, recs] of byItem) {
    const sorted = recs.sort((a, b) => {
      const da = parseDate(a.tglPO)?.getTime() ?? 0
      const db = parseDate(b.tglPO)?.getTime() ?? 0
      return db - da
    })
    const latest = sorted[0]
    const tabParts = latest.tab.split('-')
    const tabProduct = tabParts[0]?.trim() ?? latest.tab
    const tabSupplier = tabParts.slice(1).join('-').trim() || latest.supplier

    summaries.push({
      item: latest.item,
      tab: latest.tab,
      tabProduct,
      tabSupplier,
      latestPrice: latest.priceIncPPN,
      latestPriceExPPN: latest.priceExPPN,
      latestDate: latest.tglPO,
      latestSupplier: latest.supplier || tabSupplier,
      packing: latest.packing,
      history: sorted.slice(0, 10).map(r => ({
        date: r.tglPO,
        supplier: r.supplier || tabSupplier,
        priceIncPPN: r.priceIncPPN,
        priceExPPN: r.priceExPPN,
        qty: r.poQty,
        packing: r.packing,
      })),
    })
  }

  return summaries.sort((a, b) => a.item.localeCompare(b.item))
}
