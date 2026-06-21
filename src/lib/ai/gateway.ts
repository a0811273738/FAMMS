import { researchProducts, compareProducts } from './providers/openai'
import type { ResearchProduct, ResearchResult, ComparisonResult } from './providers/openai'

export type { ResearchProduct, ResearchResult, ComparisonResult }

export async function gatewayResearch(query: string): Promise<ResearchResult> {
  // Future: if (process.env.PERPLEXITY_API_KEY) return perplexityResearch(query)
  return researchProducts(query)
}

export async function gatewayCompare(products: ResearchProduct[]): Promise<ComparisonResult> {
  // Future: if (process.env.ANTHROPIC_API_KEY) return claudeCompare(products)
  return compareProducts(products)
}
