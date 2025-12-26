import { useEffect, useState, useMemo } from 'react'
import { Flame, Beef, Wheat, Droplet } from 'lucide-react'
import { getFoodWithNutrients } from '@/services/foods'
import type { RecipeIngredient } from '@/types/recipe'
import type { Database } from '@/types/database'

type FoodNutrients = Database['public']['Tables']['food_nutrients']['Row']

interface NutritionSummaryProps {
  ingredients: RecipeIngredient[]
  servings: number
  currentServings?: number
}

interface NutritionTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export function NutritionSummary({ ingredients, servings, currentServings }: NutritionSummaryProps) {
  const [totals, setTotals] = useState<NutritionTotals | null>(null)
  const [loading, setLoading] = useState(false)

  const matchedIngredients = useMemo(
    () =>
      ingredients.filter(
        (ing) => ing.food_id && (ing.match_status === 'matched' || ing.match_status === 'user_confirmed')
      ),
    [ingredients]
  )

  const foodIds = useMemo(
    () => matchedIngredients.map((i) => i.food_id).join(','),
    [matchedIngredients]
  )

  useEffect(() => {
    if (matchedIngredients.length === 0) {
      setTotals(null)
      return
    }

    const fetchNutrition = async () => {
      setLoading(true)
      try {
        const nutritionData = await Promise.all(
          matchedIngredients.map(async (ing) => {
            if (!ing.food_id) return null
            const food = await getFoodWithNutrients(ing.food_id) as {
              food_nutrients: FoodNutrients[]
            } | null
            return food?.food_nutrients?.[0] || null
          })
        )

        const calculated: NutritionTotals = {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        }

        nutritionData.forEach((nutrients: FoodNutrients | null) => {
          if (nutrients) {
            calculated.calories += nutrients.calories || 0
            calculated.protein_g += nutrients.protein_g || 0
            calculated.carbs_g += nutrients.carbs_g || 0
            calculated.fat_g += nutrients.fat_g || 0
          }
        })

        setTotals(calculated)
      } catch (error) {
        console.error('Failed to fetch nutrition data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNutrition()
  }, [matchedIngredients, foodIds])

  if (matchedIngredients.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Match ingredients to foods to see nutrition info
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        Calculating nutrition...
      </div>
    )
  }

  if (!totals) {
    return null
  }

  const servingsToUse = currentServings ?? servings

  const perServing = {
    calories: Math.round(totals.calories / servingsToUse),
    protein_g: Math.round(totals.protein_g / servingsToUse),
    carbs_g: Math.round(totals.carbs_g / servingsToUse),
    fat_g: Math.round(totals.fat_g / servingsToUse),
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        Per Serving ({servingsToUse} {servingsToUse === 1 ? 'serving' : 'servings'}) · {matchedIngredients.length}/{ingredients.length} matched
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
          <Flame className="h-4 w-4 text-orange-500" />
          <div>
            <div className="text-lg font-semibold text-orange-700">{perServing.calories}</div>
            <div className="text-xs text-orange-600">Calories</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <Beef className="h-4 w-4 text-red-500" />
          <div>
            <div className="text-lg font-semibold text-red-700">{perServing.protein_g}g</div>
            <div className="text-xs text-red-600">Protein</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
          <Wheat className="h-4 w-4 text-amber-500" />
          <div>
            <div className="text-lg font-semibold text-amber-700">{perServing.carbs_g}g</div>
            <div className="text-xs text-amber-600">Carbs</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
          <Droplet className="h-4 w-4 text-yellow-600" />
          <div>
            <div className="text-lg font-semibold text-yellow-700">{perServing.fat_g}g</div>
            <div className="text-xs text-yellow-600">Fat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
