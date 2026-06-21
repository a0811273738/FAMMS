import { firecrawlScrape } from './firecrawl'
import { jinaRead } from './jina'

export type ScrapeSource = 'firecrawl' | 'jina' | 'none'

export interface ScrapeResult {
  content: string
  source: ScrapeSource
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const content = await firecrawlScrape(url)
      if (content.length > 200) return { content, source: 'firecrawl' }
    } catch {
      // fall through to Jina
    }
  }

  try {
    const content = await jinaRead(url)
    if (content.length > 200) return { content, source: 'jina' }
  } catch {
    // fall through
  }

  return { content: '', source: 'none' }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapeResult[]> {
  return Promise.all(urls.map(url => scrapeUrl(url)))
}
