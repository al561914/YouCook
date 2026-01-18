import { useState, useMemo } from 'react'
import { Check, X, AlertCircle, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FoodSearch } from '@/components/foods/FoodSearch'
import { matchIngredientToFood, unmatchIngredient } from '@/services/foods'
import type { RecipeIngredient } from '@/types/recipe'
import type { FoodSearchResult } from '@/types/food'

interface IngredientReviewModalProps {
  open: boolean
  onClose: () => void
  ingredients: RecipeIngredient[]
  onUpdate: () => void
}

interface MatchCandidate {
  id: string
  name: string
  brand?: string
  confidence: number
}

type IngredientStatus = 'matched' | 'needs_review' | 'unmatched'

interface GroupedIngredient extends RecipeIngredient {
  status: IngredientStatus
  candidates: MatchCandidate[]
}

export function IngredientReviewModal({
  open,
  onClose,
  ingredients,
  onUpdate,
}: IngredientReviewModalProps) {
  const [searchingIngredient, setSearchingIngredient] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Group ingredients by status
  const groupedIngredients = useMemo(() => {
    return ingredients.map((ing): GroupedIngredient => {
      // Parse match_candidates from Json type
      let candidates: MatchCandidate[] = []
      try {
        if (Array.isArray(ing.match_candidates)) {
          candidates = (ing.match_candidates as unknown as MatchCandidate[])
        }
      } catch {
        candidates = []
      }

      let status: IngredientStatus
      if (ing.match_status === 'matched' || ing.match_status === 'user_confirmed') {
        status = 'matched'
      } else if (candidates.length > 0) {
        status = 'needs_review'
      } else {
        status = 'unmatched'
      }

      return {
        ...ing,
        status,
        candidates,
      }
    })
  }, [ingredients])

  const statusCounts = useMemo(() => {
    return groupedIngredients.reduce(
      (acc, ing) => {
        acc[ing.status]++
        return acc
      },
      { matched: 0, needs_review: 0, unmatched: 0 }
    )
  }, [groupedIngredients])

  const handleAcceptMatch = async (ingredientId: string, candidate: MatchCandidate) => {
    setUpdating(ingredientId)
    try {
      const foodSearchResult: FoodSearchResult = {
        id: candidate.id,
        name: candidate.name,
        brand: candidate.brand || null,
        source: 'usda', // Assuming USDA for now
        externalId: candidate.id,
        servingSize: null,
        servingUnit: null,
        servingDescription: null,
        nutrients: {
          calories: null,
          protein_g: null,
          carbs_g: null,
          fat_g: null,
          fiber_g: null,
          sugar_g: null,
          sodium_mg: null,
        },
      }
      await matchIngredientToFood(ingredientId, foodSearchResult)
      onUpdate()
    } catch (err) {
      console.error('Failed to accept match:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleSearchSelect = async (ingredientId: string, food: FoodSearchResult) => {
    setUpdating(ingredientId)
    try {
      await matchIngredientToFood(ingredientId, food)
      setSearchingIngredient(null)
      onUpdate()
    } catch (err) {
      console.error('Failed to match ingredient:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleUnmatch = async (ingredientId: string) => {
    setUpdating(ingredientId)
    try {
      await unmatchIngredient(ingredientId)
      onUpdate()
    } catch (err) {
      console.error('Failed to unmatch ingredient:', err)
    } finally {
      setUpdating(null)
    }
  }

  const allResolved = statusCounts.needs_review === 0 && statusCounts.unmatched === 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Ingredients</DialogTitle>
          <DialogDescription>
            Verify AI-parsed ingredients and match them to nutrition data
          </DialogDescription>
        </DialogHeader>

        {/* Status Summary */}
        <div className="flex gap-2 py-2">
          <Badge variant={statusCounts.matched > 0 ? 'default' : 'outline'} className="bg-green-100 text-green-800 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            {statusCounts.matched} Matched
          </Badge>
          <Badge variant={statusCounts.needs_review > 0 ? 'default' : 'outline'} className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            {statusCounts.needs_review} Needs Review
          </Badge>
          <Badge variant={statusCounts.unmatched > 0 ? 'default' : 'outline'} className="bg-red-100 text-red-800 border-red-300">
            <X className="h-3 w-3 mr-1" />
            {statusCounts.unmatched} Not Found
          </Badge>
        </div>

        {/* Ingredients List */}
        <div className="flex-1 overflow-y-auto border rounded-md divide-y">
          {groupedIngredients.map((ingredient) => (
            <div key={ingredient.id} className="p-4 space-y-2">
              {/* Ingredient Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {ingredient.status === 'matched' && (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                    {ingredient.status === 'needs_review' && (
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    )}
                    {ingredient.status === 'unmatched' && (
                      <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900">
                      {ingredient.quantity && ingredient.unit
                        ? `${ingredient.quantity} ${ingredient.unit} `
                        : ingredient.quantity
                        ? `${ingredient.quantity} `
                        : ''}
                      {ingredient.name}
                    </span>
                  </div>
                  {ingredient.original_text && (
                    <p className="text-sm text-gray-500 mt-1 ml-6">{ingredient.original_text}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchingIngredient(ingredient.id)}
                  disabled={updating === ingredient.id}
                >
                  <SearchIcon className="h-3 w-3 mr-1" />
                  Search
                </Button>
              </div>

              {/* Matched Food - Show current match */}
              {ingredient.status === 'matched' && ingredient.food_id && (
                <div className="ml-6 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-green-900">Matched</span>
                    <span className="text-green-700 ml-2">
                      {/* TODO: Show food name from food_id */}
                      Food matched
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnmatch(ingredient.id)}
                    disabled={updating === ingredient.id}
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Suggested Matches - Show candidates */}
              {ingredient.status === 'needs_review' && ingredient.candidates.length > 0 && (
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-600">Suggestions:</p>
                  {ingredient.candidates.map((candidate, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                        {candidate.brand && (
                          <p className="text-xs text-gray-600">{candidate.brand}</p>
                        )}
                        {candidate.confidence && (
                          <p className="text-xs text-gray-500">
                            {Math.round(candidate.confidence * 100)}% confidence
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptMatch(ingredient.id, candidate)}
                        disabled={updating === ingredient.id}
                      >
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* No Match Found */}
              {ingredient.status === 'unmatched' && (
                <div className="ml-6 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    No matches found. Use search to find a nutrition match.
                  </p>
                </div>
              )}

              {/* Food Search Dialog */}
              {searchingIngredient === ingredient.id && (
                <div className="ml-6 mt-2 p-3 border-2 border-blue-300 rounded-lg bg-blue-50">
                  <FoodSearch
                    initialQuery={ingredient.name}
                    onSelect={(food) => handleSearchSelect(ingredient.id, food)}
                    onCancel={() => setSearchingIngredient(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          {!allResolved && (
            <p className="text-sm text-yellow-600 mr-auto">
              Some ingredients need review before continuing
            </p>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onClose} disabled={!allResolved}>
            {allResolved ? 'Done' : 'Save Progress'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
