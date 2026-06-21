import { analyzeSearchIntent, researchProducts, extractProductsFromContent, compareProducts } from './providers/openai'
import type { SearchIntent, ResearchProduct, ResearchResult, ComparisonResult } from './providers/openai'
import { scrapeUrls } from '@/lib/scraper'

export type { SearchIntent, ResearchProduct, ResearchResult, ComparisonResult }

export async function gatewayAnalyzeIntent(query: string): Promise<SearchIntent> {
  return analyzeSearchIntent(query)
}

export async function gatewayResearch(query: string, intent: SearchIntent): Promise<ResearchResult> {
  const keyword = intent.expandedKeywords[0] ?? query
  const encoded = encodeURIComponent(keyword)

  const shopeeUrl = `https://shopee.co.id/search?keyword=${encoded}`
  const tokopediaUrl = `https://www.tokopedia.com/search?st=product&q=${encoded}`

  // Scrape both marketplaces in parallel
  const [shopeeResult, tokopediaResult] = await scrapeUrls([shopeeUrl, tokopediaUrl])

  const scrapedProducts: ResearchProduct[] = []

  if (shopeeResult.source !== 'none' && shopeeResult.content.length > 300) {
    const products = await extractProductsFromContent(shopeeResult.content, keyword, 'Shopee', 0)
    scrapedProducts.push(...products.map(p => ({
      ...p,
      shopeeSearchUrl: shopeeUrl,
      dataSource: shopeeResult.source as 'firecrawl' | 'jina',
    })))
  }

  if (tokopediaResult.source !== 'none' && tokopediaResult.content.length > 300) {
    const products = await extractProductsFromContent(tokopediaResult.content, keyword, 'Tokopedia', scrapedProducts.length)
    scrapedProducts.push(...products.map(p => ({
      ...p,
      tokopediaSearchUrl: tokopediaUrl,
      dataSource: tokopediaResult.source as 'firecrawl' | 'jina',
    })))
  }

  // If scraping yielded enough real products, use them
  if (scrapedProducts.length >= 3) {
    const deduped = deduplicateProducts(scrapedProducts).slice(0, 6)
    return { query, intent, products: deduped, scraped: true }
  }

  // Fallback: AI-generated products (supplement scraped ones if any)
  const aiProducts = await researchProducts(query, intent)
  const aiTagged = aiProducts.map(p => ({ ...p, dataSource: 'ai' as const }))

  const combined = deduplicateProducts([...scrapedProducts, ...aiTagged]).slice(0, 6)
  return { query, intent, products: combined, scraped: scrapedProducts.length > 0 }
}

export async function gatewayCompare(products: ResearchProduct[]): Promise<ComparisonResult> {
  return compareProducts(products)
}

function deduplicateProducts(products: ResearchProduct[]): ResearchProduct[] {
  const seen = new Set<string>()
  return products.filter(p => {
    const key = p.name.toLowerCase().slice(0, 30)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
