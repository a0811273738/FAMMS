export async function jinaRead(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      'Accept': 'text/plain',
      'X-Return-Format': 'markdown',
      'X-Timeout': '15',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Jina failed: ${res.status}`)
  return res.text()
}
