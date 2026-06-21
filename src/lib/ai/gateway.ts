import { analyzeSearchIntent, researchProducts, compareProducts } from './providers/openai'
import type { SearchIntent, ResearchProduct, ResearchResult, ComparisonResult } from './providers/openai'

export type { SearchIntent, ResearchProduct, ResearchResult, ComparisonResult }

export async function gatewayAnalyzeIntent(query: string): Promise<SearchIntent> {
  return analyzeSearchIntent(query)
}

export async function gatewayResearch(query: string, intent: SearchIntent): Promise<ResearchResult> {
  const products = await researchProducts(query, intent)
  return { query, intent, products }
}

export async function gatewayCompare(products: ResearchProduct[]): Promise<ComparisonResult> {
  return compareProducts(products)
}
