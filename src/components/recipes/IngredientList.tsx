import { useState } from 'react'
import { Link2, Link2Off, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FoodSearch } from '@/components/foods'
import { matchIngredientToFood, unmatchIngredient } from '@/services/foods'
import { formatQuantity } from '@/lib/units'
import { cn } from '@/lib/utils'
import type { RecipeIngredient } from '@/types/recipe'
import type { FoodSearchResult } from '@/types/food'

interface IngredientListProps {
  ingredients: RecipeIngredient[]
  editable?: boolean
  onUpdate?: () => void
  servingMultiplier?: number
  checkable?: boolean
  checkedIngredients?: Set<string>
  onToggleIngredient?: (id: string) => void
}

export function IngredientList({
  ingredients,
  editable = false,
  onUpdate,
  servingMultiplier = 1,
  checkable = false,
  checkedIngredients,
  onToggleIngredient,
}: IngredientListProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeIngredient | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleOpenSearch = (ingredient: RecipeIngredient) => {
    setSelectedIngredient(ingredient)
    setSearchOpen(true)
  }

  const handleSelectFood = async (food: FoodSearchResult) => {
    if (!selectedIngredient) return

    setLoading(selectedIngredient.id)
    try {
      await matchIngredientToFood(selectedIngredient.id, food)
      setSearchOpen(false)
      setSelectedIngredient(null)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to match ingredient:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUnmatch = async (ingredient: RecipeIngredient) => {
    setLoading(ingredient.id)
    try {
      await unmatchIngredient(ingredient.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to unmatch ingredient:', error)
    } finally {
      setLoading(null)
    }
  }

  const getMatchStatusBadge = (ingredient: RecipeIngredient) => {
    switch (ingredient.match_status) {
      case 'matched':
      case 'user_confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
            <Link2 className="h-3 w-3" />
            Matched
          </span>
        )
      case 'unmatched':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            <Link2Off className="h-3 w-3" />
            Unmatched
          </span>
        )
      default:
        return null
    }
  }

  return (
    <>
      <ul className="space-y-3">
        {ingredients.map((ing) => {
          const adjustedQuantity = ing.quantity
            ? formatQuantity(ing.quantity * servingMultiplier)
            : null

          return (
            <li
              key={ing.id}
              className={cn(
                'flex items-start gap-2 transition-opacity',
                checkable && checkedIngredients?.has(ing.id) && 'opacity-50'
              )}
            >
              {checkable && (
                <input
                  type="checkbox"
                  checked={checkedIngredients?.has(ing.id)}
                  onChange={() => onToggleIngredient?.(ing.id)}
                  className="mt-1.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
              )}
              <span className="text-gray-400 mt-1">-</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="break-words">
                    {adjustedQuantity && <strong>{adjustedQuantity}</strong>}
                    {ing.unit && ' ' + ing.unit} {ing.name}
                    {ing.preparation && <span className="text-gray-500">, {ing.preparation}</span>}
                  </span>
                  {editable && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getMatchStatusBadge(ing)}
                      {ing.match_status === 'unmatched' || !ing.food_id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSearch(ing)}
                          disabled={loading === ing.id}
                          className="h-7 px-2"
                        >
                          <Search className="h-3 w-3 mr-1" />
                          Match
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnmatch(ing)}
                          disabled={loading === ing.id}
                          className="h-7 px-2 text-gray-500"
                        >
                          Unmatch
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Ingredient</DialogTitle>
            <DialogDescription>
              Search for a food to match with "{selectedIngredient?.name}"
            </DialogDescription>
          </DialogHeader>
          <FoodSearch
            initialQuery={selectedIngredient?.name || ''}
            onSelect={handleSelectFood}
            onCancel={() => setSearchOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
