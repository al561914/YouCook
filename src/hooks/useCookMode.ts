import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookModeStore } from '@/stores/cookModeStore'

export function useCookMode(recipeId: string | undefined, totalSteps: number) {
  const navigate = useNavigate()
  const store = useCookModeStore()

  // Initialize cook mode when component mounts
  useEffect(() => {
    if (recipeId && totalSteps > 0) {
      // Check if this is the same recipe, if not start fresh
      if (store.recipeId !== recipeId) {
        store.startCookMode(recipeId, totalSteps)
      } else if (store.totalSteps !== totalSteps) {
        // Update total steps if recipe was re-parsed
        store.startCookMode(recipeId, totalSteps)
      }
    }
  }, [recipeId, totalSteps, store])

  // Exit handler - navigates back to recipe view
  const exitCookMode = () => {
    store.exitCookMode()
    navigate(`/recipes/${recipeId}`)
  }

  return {
    currentStepIndex: store.currentStepIndex,
    totalSteps: store.totalSteps,
    checkedIngredients: store.checkedIngredients,
    servingMultiplier: store.servingMultiplier,
    goToStep: store.goToStep,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    toggleIngredient: store.toggleIngredient,
    setServingMultiplier: store.setServingMultiplier,
    exitCookMode,
  }
}
