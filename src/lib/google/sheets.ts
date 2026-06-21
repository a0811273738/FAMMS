import { google } from 'googleapis'

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
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
  const cleaned = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function twoYearsAgo(): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 2)
  return d
}

export async function getAllMaterials(): Promise<MaterialSummary[]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!

  // Get all sheet/tab names
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const tabs = meta.data.sheets?.map(s => s.properties?.title ?? '').filter(Boolean) ?? []

  const cutoff = twoYearsAgo()
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

        // Find header row (look for "ITEM" column)
        let headerIdx = 0
        for (let r = 0; r < Math.min(5, rows.length); r++) {
          if (rows[r].some((c: string) => String(c).toUpperCase().includes('ITEM'))) {
            headerIdx = r
            break
          }
        }
        const headers = rows[headerIdx].map((h: string) => String(h).trim().toUpperCase())

        const col = (name: string) => headers.findIndex(h => h.includes(name))
        const iItem = col('ITEM')
        const iSupplier = col('SUPPLIER')
        const iPriceEx = col('ORIGINAL PRICE') !== -1 ? col('ORIGINAL PRICE') : col('EXCLUDE')
        const iPriceInc = col('INCLUDE')
        const iQty = col('PO QTY')
        const iPacking = col('PACKING')
        const iTglPO = col('TGL') !== -1 ? col('TGL') : 0
        const iCodeSupplier = 0
        const iCodeBB = 1

        if (iItem === -1) return

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r]
          const item = String(row[iItem] ?? '').trim()
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
    summaries.push({
      item: latest.item,
      tab: latest.tab,
      latestPrice: latest.priceIncPPN,
      latestPriceExPPN: latest.priceExPPN,
      latestDate: latest.tglPO,
      latestSupplier: latest.supplier,
      packing: latest.packing,
      history: sorted.slice(0, 10).map(r => ({
        date: r.tglPO,
        supplier: r.supplier,
        priceIncPPN: r.priceIncPPN,
        priceExPPN: r.priceExPPN,
        qty: r.poQty,
        packing: r.packing,
      })),
    })
  }

  return summaries.sort((a, b) => a.item.localeCompare(b.item))
}
