'use client'

import { useState, useRef } from 'react'
import { Search, RefreshCw, GitCompare, X, CheckSquare, Square, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { ResearchProduct, ResearchResult, ComparisonResult } from '@/lib/ai/gateway'

export default function ResearchClient() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResult(null)
    setSelected(new Set())
    setComparison(null)
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      toast.error(err.message ?? 'Research failed')
    } finally {
      setSearching(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setComparison(null)
  }

  async function handleCompare() {
    if (!result) return
    const products = result.products.filter(p => selected.has(p.id))
    if (products.length < 2) { toast.error('Select at least 2 products to compare'); return }
    setComparing(true)
    setComparison(null)
    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setComparison(data)
      setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: any) {
      toast.error(err.message ?? 'Comparison failed')
    } finally {
      setComparing(false)
    }
  }

  const selectedProducts = result?.products.filter(p => selected.has(p.id)) ?? []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Product Research Center</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-powered product discovery and comparison for smarter procurement</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder='e.g. "industrial label printer", "office ergonomic chair"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={searching}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {searching ? 'Researching...' : 'Research'}
        </button>
      </form>

      {/* Skeleton */}
      {searching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => <div key={j} className="h-3 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && !searching && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {result.products.length} products found for &ldquo;{result.query}&rdquo;
              {selected.size > 0 && <span className="ml-2 text-blue-600 font-medium">· {selected.size} selected</span>}
            </p>
            {selected.size >= 2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                {comparing ? 'Comparing...' : `Compare ${selected.size} Products`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {result.products.map(product => {
              const isSelected = selected.has(product.id)
              return (
                <div
                  key={product.id}
                  onClick={() => toggleSelect(product.id)}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">{product.category}</span>
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">{product.name}</h3>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                    </div>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {product.keySpecs.map((spec, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-blue-400 mt-0.5 shrink-0">·</span>{spec}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
                    <p className="text-xs text-gray-500">Est. Price Range</p>
                    <p className="text-sm font-bold text-gray-900">{product.estimatedPriceRange}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.suggestedSuppliers.map((s, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-3" onClick={e => e.stopPropagation()}>
                    {product.shopeeSearchUrl && (
                      <a href={product.shopeeSearchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors font-medium">
                        <ExternalLink className="w-3 h-3" />Shopee
                      </a>
                    )}
                    {product.tokopediaSearchUrl && (
                      <a href={product.tokopediaSearchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors font-medium">
                        <ExternalLink className="w-3 h-3" />Tokopedia
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{product.notes}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Comparison */}
      {comparison && (
        <div ref={comparisonRef} className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Comparison Analysis</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selectedProducts.map(p => p.name).join(' vs ')}</p>
            </div>
            <button onClick={() => setComparison(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-900">{comparison.summary}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 w-36">Criterion</th>
                  {selectedProducts.map(p => (
                    <th key={p.id} className="text-left text-xs font-semibold text-gray-900 px-4 py-3">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.tableRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-5 py-3 text-xs font-semibold text-gray-600">{row.criterion}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="px-4 py-3 text-xs text-gray-700">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-sm text-gray-900">{comparison.recommendation}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searching && !result && (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a product or requirement to start researching</p>
        </div>
      )}
    </div>
  )
}
