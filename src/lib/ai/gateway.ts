import { researchProducts, compareProducts } from './providers/openai'
export type { ResearchProduct, ResearchResult, ComparisonResult } from './providers/openai'

export async function gatewayResearch(query: string) {
  // Future: if (process.env.PERPLEXITY_API_KEY) return perplexityResearch(query)
  return researchProducts(query)
}

export async function gatewayCompare(products: import('./providers/openai').ResearchProduct[]) {
  // Future: if (process.env.ANTHROPIC_API_KEY) return claudeCompare(products)
  return compareProducts(products)
}
