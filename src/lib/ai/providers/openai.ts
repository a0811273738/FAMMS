import OpenAI from 'openai'

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

export interface ResearchProduct {
  id: string
  name: string
  category: string
  keySpecs: string[]
  estimatedPriceRange: string
  suggestedSuppliers: string[]
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
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `You are a procurement specialist. A user is researching "${query}" for industrial/business purchasing in Indonesia.

Generate 4–6 distinct product options. Each should represent a different tier (entry-level, mid-range, premium) or approach.

Respond ONLY with valid JSON:
{
  "query": "${query}",
  "products": [
    {
      "id": "product-0",
      "name": "Specific Product Name",
      "category": "Category",
      "keySpecs": ["spec 1", "spec 2", "spec 3", "spec 4"],
      "estimatedPriceRange": "IDR X,XXX,XXX – Y,YYY,YYY",
      "suggestedSuppliers": ["Supplier A", "Supplier B"],
      "notes": "One to two sentence purchasing note."
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
    `${i + 1}. ${p.name}: ${p.keySpecs.join(', ')} | Price: ${p.estimatedPriceRange}`
  ).join('\n')

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `You are a procurement analyst. Compare these ${products.length} products for a business purchasing decision:

${productList}

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence executive summary",
  "tableRows": [
    { "criterion": "Price Range", "values": ["value for product 1", "value for product 2"] },
    { "criterion": "Key Strength", "values": [...] },
    { "criterion": "Best For", "values": [...] },
    { "criterion": "Main Trade-off", "values": [...] },
    { "criterion": "Supplier Availability", "values": [...] }
  ],
  "recommendation": "Clear purchasing recommendation with brief reasoning"
}`,
    }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}')
}
