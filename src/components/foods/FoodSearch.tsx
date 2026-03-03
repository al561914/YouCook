import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { searchFoods, searchLocalFoods } from '@/services/foods'
import type { FoodSearchResult } from '@/types/food'

interface FoodSearchProps {
  initialQuery?: string
  localOnly?: boolean
  onSelect: (food: FoodSearchResult) => void
  onCancel: () => void
}

export function FoodSearch({ initialQuery = '', localOnly = false, onSelect, onCancel }: FoodSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return

    setLoading(true)
    setError(null)

    try {
      if (localOnly) {
        const foods = await searchLocalFoods(query, 20)
        setResults(foods)
      } else {
        const response = await searchFoods(query, 15)
        setResults(response.foods)
      }
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [query, localOnly])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search foods..."
            className="pl-10"
            autoFocus
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || query.trim().length < 2}>
          {loading ? <LoadingSpinner size="sm" /> : 'Search'}
        </Button>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No foods found for "{query}"
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
          {results.map((food) => (
            <button
              key={food.id}
              onClick={() => onSelect(food)}
              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 line-clamp-2 break-words">{food.name}</p>
                  {food.brand && (
                    <p className="text-sm text-gray-500 line-clamp-1">{food.brand}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right text-sm ml-2">
                  {food.nutrients.calories !== null && (
                    <p className="font-medium">{Math.round(food.nutrients.calories)} cal</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {food.servingSize && food.servingSize !== 100
                      ? `per ${food.servingSize}${food.servingUnit ?? 'g'} serving`
                      : 'per 100g'}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                {food.nutrients.protein_g !== null && (
                  <span>P: {food.nutrients.protein_g.toFixed(1)}g</span>
                )}
                {food.nutrients.carbs_g !== null && (
                  <span>C: {food.nutrients.carbs_g.toFixed(1)}g</span>
                )}
                {food.nutrients.fat_g !== null && (
                  <span>F: {food.nutrients.fat_g.toFixed(1)}g</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
