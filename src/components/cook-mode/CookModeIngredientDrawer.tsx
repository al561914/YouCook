import { useState } from 'react'
import { List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { IngredientList, ServingAdjuster } from '@/components/recipes'
import { useCookModeStore } from '@/stores/cookModeStore'
import type { RecipeWithRelations } from '@/types/recipe'

interface CookModeIngredientDrawerProps {
  recipe: RecipeWithRelations
}

export function CookModeIngredientDrawer({ recipe }: CookModeIngredientDrawerProps) {
  const [open, setOpen] = useState(false)
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
    <>
      {/* Floating action button - fixed bottom right */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:hidden rounded-full shadow-lg h-14 px-6 z-40"
        size="lg"
      >
        <List className="mr-2 h-5 w-5" />
        Ingredients
      </Button>

      {/* Bottom sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Ingredients</SheetTitle>
            <div className="pt-2">
              <ServingAdjuster
                currentServings={currentServings}
                onServingsChange={handleServingChange}
                variant="compact"
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
