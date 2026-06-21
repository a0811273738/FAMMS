export async function firecrawlScrape(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set')

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Firecrawl failed: ${res.status}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Firecrawl error')
  return data.data?.markdown ?? ''
}
