import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientList, ServingAdjuster } from '@/components/recipes'
import { useCookModeStore } from '@/stores/cookModeStore'
import type { RecipeWithRelations } from '@/types/recipe'

interface CookModeIngredientSidebarProps {
  recipe: RecipeWithRelations
}

export function CookModeIngredientSidebar({ recipe }: CookModeIngredientSidebarProps) {
  const {
    checkedIngredients,
    toggleIngredient,
    servingMultiplier,
    setServingMultiplier,
  } = useCookModeStore()

  const currentServings = Math.round((recipe.servings || 1) * servingMultiplier)

  const handleServingChange = (newServings: number) => {
    const baseServings = recipe.servings || 1
    setServingMultiplier(newServings / baseServings)
  }

  return (
    <div className="overflow-y-auto p-4 bg-gray-50 border-r">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ingredients</CardTitle>
          <div className="pt-2">
            <ServingAdjuster
              currentServings={currentServings}
              onServingsChange={handleServingChange}
              variant="inline"
            />
          </div>
        </CardHeader>
        <CardContent>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <IngredientList
              ingredients={recipe.ingredients}
              servingMultiplier={servingMultiplier}
              checkable
              checkedIngredients={checkedIngredients}
              onToggleIngredient={toggleIngredient}
            />
          ) : (
            <p className="text-sm text-gray-500">No ingredients listed</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
