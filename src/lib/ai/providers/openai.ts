import OpenAI from 'openai'

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

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
}

export interface ResearchResult {
  query: string
  products: ResearchProduct[]
}

export interface ComparisonResult {
  summary: string
  tableRows: Array<{ criterion: string; values: string[] }>
  recommendation: string
}

export async function researchProducts(query: string): Promise<ResearchResult> {
  const encoded = encodeURIComponent(query)
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Kamu adalah spesialis pengadaan barang. Pengguna sedang mencari "${query}" untuk keperluan bisnis/industri di Indonesia.

Buat 4–6 opsi produk yang berbeda. Setiap produk mewakili tingkat yang berbeda (entry-level, menengah, premium) atau pendekatan yang berbeda.
Semua teks harus dalam Bahasa Indonesia. Gunakan URL pencarian Shopee dan Tokopedia yang benar untuk setiap produk.

Jawab HANYA dengan JSON yang valid:
{
  "query": "${query}",
  "products": [
    {
      "id": "product-0",
      "name": "Nama Produk Spesifik",
      "category": "Kategori Produk",
      "keySpecs": ["spesifikasi 1", "spesifikasi 2", "spesifikasi 3", "spesifikasi 4"],
      "estimatedPriceRange": "Rp X.XXX.XXX – Rp Y.YYY.YYY",
      "suggestedSuppliers": ["Nama Supplier A", "Nama Supplier B"],
      "shopeeSearchUrl": "https://shopee.co.id/search?keyword=${encoded}",
      "tokopediaSearchUrl": "https://www.tokopedia.com/search?st=product&q=${encoded}",
      "notes": "Satu hingga dua kalimat catatan pembelian yang relevan."
    }
  ]
}`,
    }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}')
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

Fokus perbandingan pada SPESIFIKASI TEKNIS dan HARGA saja. Jangan tulis kelebihan umum atau kegunaan — langsung ke angka dan detail teknis.
Semua teks harus dalam Bahasa Indonesia.

Jawab HANYA dengan JSON yang valid:
{
  "summary": "Ringkasan eksekutif 2-3 kalimat dalam Bahasa Indonesia, fokus pada perbedaan harga dan spesifikasi utama",
  "tableRows": [
    { "criterion": "Rentang Harga", "values": ["harga produk 1", "harga produk 2"] },
    { "criterion": "Spesifikasi Utama", "values": ["spek teknis produk 1", "spek teknis produk 2"] },
    { "criterion": "Dimensi & Berat", "values": ["dimensi produk 1", "dimensi produk 2"] },
    { "criterion": "Konsumsi Daya", "values": ["daya produk 1", "daya produk 2"] },
    { "criterion": "Garansi", "values": ["garansi produk 1", "garansi produk 2"] },
    { "criterion": "Supplier Tersedia", "values": ["supplier produk 1", "supplier produk 2"] }
  ],
  "recommendation": "Rekomendasi pembelian yang jelas berdasarkan perbandingan harga, volume penjualan toko, dan reputasi supplier di Indonesia"
}`,
    }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}')
}
