import OpenAI from 'openai'

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

export interface SearchIntent {
  product: string
  industry: string | null
  budget: string | null
  expandedKeywords: string[]
  isAmbiguous: boolean
  suggestedCategories: string[] | null
}

export interface ResearchProduct {
  id: string
  name: string
  category: string
  keySpecs: string[]
  estimatedPriceRange: string
  suggestedSuppliers: string[]
  shopeeSearchUrl: string
  tokopediaSearchUrl: string
  notes: string
  dataSource?: 'firecrawl' | 'jina' | 'ai'
}

export interface ResearchResult {
  query: string
  intent: SearchIntent
  products: ResearchProduct[]
  scraped: boolean
}

export interface ComparisonResult {
  summary: string
  tableRows: Array<{ criterion: string; values: string[] }>
  recommendation: string
}

export async function analyzeSearchIntent(query: string): Promise<SearchIntent> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Kamu adalah sistem analisis pencarian pengadaan untuk bisnis di Indonesia.

Pengguna memasukkan: "${query}"

Tugasmu:
1. Tentukan apakah kata kunci ini AMBIGU (bisa berarti banyak produk berbeda) atau JELAS.
2. Jika AMBIGU: berikan 3-5 kategori pilihan untuk user pilih.
3. Jika JELAS: buat 4-6 keyword pencarian yang lebih spesifik untuk pengadaan.
4. Ekstrak informasi tambahan jika ada (industri, anggaran, dll).

Contoh AMBIGU: "printer", "mesin", "pompa", "filter"
Contoh JELAS: "label printer thermal", "asam sitrat food grade", "kursi ergonomis kantor"

Jawab HANYA dengan JSON valid:
{
  "product": "Nama produk yang dipahami",
  "industry": "Industri yang relevan atau null",
  "budget": "Anggaran jika disebutkan atau null",
  "expandedKeywords": ["keyword spesifik 1", "keyword spesifik 2", "keyword spesifik 3", "keyword spesifik 4"],
  "isAmbiguous": false,
  "suggestedCategories": null
}

Jika ambigu, set isAmbiguous: true dan isi suggestedCategories, kosongkan expandedKeywords.`,
    }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}')
}

export async function researchProducts(query: string, intent: SearchIntent): Promise<ResearchProduct[]> {
  const keywordsContext = intent.expandedKeywords.length > 0
    ? `\n\nKata kunci pencarian yang diperluas: ${intent.expandedKeywords.join(', ')}`
    : ''
  const industryContext = intent.industry ? `\nIndustri: ${intent.industry}` : ''
  const budgetContext = intent.budget ? `\nAnggaran: ${intent.budget}` : ''

  const encoded = encodeURIComponent(query)
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Kamu adalah spesialis pengadaan barang untuk bisnis/industri di Indonesia.

Pengguna mencari: "${query}"${keywordsContext}${industryContext}${budgetContext}

Buat 4–6 opsi produk yang berbeda (entry-level, menengah, premium).
Gunakan konteks kata kunci yang diperluas untuk menghasilkan produk yang LEBIH RELEVAN dan SPESIFIK.
Semua teks dalam Bahasa Indonesia.

Jawab HANYA dengan JSON valid:
{
  "products": [
    {
      "id": "product-0",
      "name": "Nama Produk Spesifik",
      "category": "Kategori Produk",
      "keySpecs": ["spesifikasi teknis 1", "spesifikasi teknis 2", "spesifikasi teknis 3", "spesifikasi teknis 4"],
      "estimatedPriceRange": "Rp X.XXX.XXX – Rp Y.YYY.YYY",
      "suggestedSuppliers": ["Nama Supplier A", "Nama Supplier B"],
      "shopeeSearchUrl": "https://shopee.co.id/search?keyword=${encoded}",
      "tokopediaSearchUrl": "https://www.tokopedia.com/search?st=product&q=${encoded}",
      "notes": "Catatan pembelian singkat yang relevan."
    }
  ]
}`,
    }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })
  const data = JSON.parse(completion.choices[0].message.content ?? '{}')
  return data.products ?? []
}

export async function extractProductsFromContent(
  content: string,
  query: string,
  sourceName: string,
  startId: number = 0,
): Promise<ResearchProduct[]> {
  if (!content || content.length < 300) return []

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Ekstrak daftar produk dari konten halaman pencarian ${sourceName} berikut.

Pengguna mencari: "${query}"

Konten halaman:
${content.slice(0, 6000)}

Ekstrak hingga 5 produk NYATA yang ada di halaman ini.
HANYA gunakan informasi dari halaman — jangan mengarang data.
Jika suatu field tidak ditemukan, gunakan "Tidak tersedia".
Semua teks dalam Bahasa Indonesia.

Jawab HANYA dengan JSON valid:
{
  "products": [
    {
      "id": "scraped-${startId}",
      "name": "nama produk dari halaman",
      "category": "kategori produk",
      "keySpecs": ["spesifikasi dari halaman"],
      "estimatedPriceRange": "harga dari halaman",
      "suggestedSuppliers": ["nama toko dari halaman"],
      "shopeeSearchUrl": "",
      "tokopediaSearchUrl": "",
      "notes": "info tambahan dari halaman"
    }
  ]
}`,
    }],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })
  const data = JSON.parse(completion.choices[0].message.content ?? '{}')
  const products: ResearchProduct[] = data.products ?? []
  return products.map((p, i) => ({ ...p, id: `scraped-${startId + i}` }))
}

export async function compareProducts(products: ResearchProduct[]): Promise<ComparisonResult> {
  const productList = products.map((p, i) =>
    `${i + 1}. ${p.name}: ${p.keySpecs.join(', ')} | Harga: ${p.estimatedPriceRange} | Supplier: ${p.suggestedSuppliers.join(', ')}`
  ).join('\n')

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Kamu adalah analis pengadaan. Bandingkan ${products.length} produk ini untuk keputusan pembelian bisnis di Indonesia:

${productList}

Fokus perbandingan pada SPESIFIKASI TEKNIS dan HARGA saja.
Semua teks dalam Bahasa Indonesia.

Jawab HANYA dengan JSON valid:
{
  "summary": "Ringkasan eksekutif 2-3 kalimat, fokus pada perbedaan harga dan spesifikasi utama",
  "tableRows": [
    { "criterion": "Rentang Harga", "values": ["harga produk 1", "harga produk 2"] },
    { "criterion": "Spesifikasi Utama", "values": ["spek teknis produk 1", "spek teknis produk 2"] },
    { "criterion": "Dimensi & Berat", "values": ["dimensi produk 1", "dimensi produk 2"] },
    { "criterion": "Konsumsi Daya", "values": ["daya produk 1", "daya produk 2"] },
    { "criterion": "Garansi", "values": ["garansi produk 1", "garansi produk 2"] },
    { "criterion": "Supplier Tersedia", "values": ["supplier produk 1", "supplier produk 2"] }
  ],
  "recommendation": "Rekomendasi pembelian berdasarkan perbandingan harga, volume penjualan, dan reputasi supplier di Indonesia"
}`,
    }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}')
}
