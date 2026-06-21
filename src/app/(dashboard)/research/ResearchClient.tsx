'use client'

import { useState, useRef } from 'react'
import { Search, RefreshCw, GitCompare, X, CheckSquare, Square, ExternalLink, Sparkles, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { SearchIntent, ResearchProduct, ResearchResult, ComparisonResult } from '@/lib/ai/gateway'

type LoadingPhase = 'idle' | 'analyzing' | 'searching'

export default function ResearchClient() {
  const [query, setQuery] = useState('')
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [intent, setIntent] = useState<SearchIntent | null>(null)
  const [ambiguous, setAmbiguous] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)

  const isSearching = loadingPhase !== 'idle'

  async function doSearch(overrideIntent?: SearchIntent) {
    if (!query.trim()) return
    setResult(null)
    setSelected(new Set())
    setComparison(null)
    setAmbiguous(false)

    try {
      if (!overrideIntent) {
        setLoadingPhase('analyzing')
      } else {
        setLoadingPhase('searching')
      }

      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, intent: overrideIntent ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.ambiguous) {
        setIntent(data.intent)
        setAmbiguous(true)
        setLoadingPhase('idle')
        return
      }

      setIntent(data.intent)
      setResult(data)
    } catch (err: any) {
      toast.error(err.message ?? 'Pencarian gagal')
    } finally {
      setLoadingPhase('idle')
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setIntent(null)
    await doSearch()
  }

  async function handleCategorySelect(category: string) {
    if (!intent) return
    const enrichedIntent: SearchIntent = {
      ...intent,
      product: category,
      isAmbiguous: false,
      suggestedCategories: null,
      expandedKeywords: [
        category,
        `${category} Indonesia`,
        `${category} industri`,
        `${category} harga`,
      ],
    }
    setIntent(enrichedIntent)
    setAmbiguous(false)
    await doSearch(enrichedIntent)
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
    if (products.length < 2) { toast.error('Pilih minimal 2 produk untuk dibandingkan'); return }
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
      toast.error(err.message ?? 'Perbandingan gagal')
    } finally {
      setComparing(false)
    }
  }

  const selectedProducts = result?.products.filter(p => selected.has(p.id)) ?? []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pusat Riset Produk</h1>
        <p className="text-sm text-gray-500 mt-0.5">Temukan dan bandingkan produk dengan bantuan AI untuk pengadaan yang lebih cerdas</p>
      </div>

      {/* Pencarian */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder='Contoh: "label printer untuk pabrik makanan", "asam sitrat 25kg"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isSearching}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isSearching ? (loadingPhase === 'analyzing' ? 'Menganalisis...' : 'Mencari...') : 'Cari'}
        </button>
      </form>

      {/* Loading phases */}
      {isSearching && (
        <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
          <div className={`flex items-center gap-1.5 ${loadingPhase === 'analyzing' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            Menganalisis kebutuhan
          </div>
          <span className="text-gray-300">→</span>
          <div className={`flex items-center gap-1.5 ${loadingPhase === 'searching' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            <Search className="w-3.5 h-3.5" />
            Mencari produk
          </div>
        </div>
      )}

      {/* Intent badges (after result) */}
      {intent && !isSearching && !ambiguous && (
        <div className="flex flex-wrap gap-2 mb-5">
          {intent.industry && (
            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" />Industri: {intent.industry}
            </span>
          )}
          {intent.budget && (
            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
              <Tag className="w-3 h-3" />Anggaran: {intent.budget}
            </span>
          )}
          {intent.expandedKeywords.length > 0 && (
            <span className="text-xs text-gray-400 self-center">
              Kata kunci: {intent.expandedKeywords.slice(0, 3).join(' · ')}
            </span>
          )}
        </div>
      )}

      {/* Category picker (ambiguous) */}
      {ambiguous && intent?.suggestedCategories && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Produk apa yang kamu cari?
          </p>
          <p className="text-xs text-amber-700 mb-4">
            Kata kunci &ldquo;{query}&rdquo; bisa berarti beberapa kategori. Pilih salah satu:
          </p>
          <div className="flex flex-wrap gap-2">
            {intent.suggestedCategories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className="px-4 py-2 bg-white border border-amber-300 text-amber-900 text-sm font-medium rounded-xl hover:bg-amber-100 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton */}
      {isSearching && (
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

      {/* Hasil Pencarian */}
      {result && !isSearching && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {result.products.length} produk ditemukan untuk &ldquo;{result.intent.product}&rdquo;
              {selected.size > 0 && <span className="ml-2 text-blue-600 font-medium">· {selected.size} dipilih</span>}
            </p>
            {selected.size >= 2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                {comparing ? 'Membandingkan...' : `Bandingkan ${selected.size} Produk`}
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
                    <p className="text-xs text-gray-500">Estimasi Harga</p>
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
                        <ExternalLink className="w-3 h-3" />Cari di Shopee
                      </a>
                    )}
                    {product.tokopediaSearchUrl && (
                      <a href={product.tokopediaSearchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors font-medium">
                        <ExternalLink className="w-3 h-3" />Cari di Tokopedia
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

      {/* Perbandingan */}
      {comparison && (
        <div ref={comparisonRef} className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Analisis Perbandingan</h2>
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
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 w-36">Kriteria</th>
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rekomendasi</p>
            <p className="text-sm text-gray-900">{comparison.recommendation}</p>
          </div>
        </div>
      )}

      {/* Kosong */}
      {!isSearching && !result && !ambiguous && (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Masukkan nama produk atau kebutuhan untuk mulai mencari</p>
          <p className="text-xs mt-1 opacity-70">AI akan membantu memperluas pencarian secara otomatis</p>
        </div>
      )}
    </div>
  )
}
