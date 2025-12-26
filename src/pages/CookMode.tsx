import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  CookModeHeader,
  CookModeStep,
  CookModeNavigation,
  CookModeIngredientDrawer,
  CookModeIngredientSidebar,
} from '@/components/cook-mode'
import { useRecipe } from '@/hooks/useRecipes'
import { useCookMode } from '@/hooks/useCookMode'

export function CookMode() {
  const { id } = useParams<{ id: string }>()
  const { recipe, loading, error } = useRecipe(id)
  const {
    currentStepIndex,
    nextStep,
    prevStep,
    exitCookMode,
  } = useCookMode(id, recipe?.steps?.length || 0)

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Recipe Not Found</CardTitle>
            <CardDescription>
              {error || 'The recipe you are looking for does not exist.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // No steps available
  if (!recipe.steps || recipe.steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Instructions Available</CardTitle>
            <CardDescription>
              This recipe hasn't been parsed yet or has no steps. Please parse the recipe first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to={`/recipes/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Recipe
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentStep = recipe.steps[currentStepIndex]
  const totalSteps = recipe.steps.length

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <CookModeHeader recipeTitle={recipe.title} onExit={exitCookMode} />

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        <CookModeStep step={currentStep} recipe={recipe} />
        <CookModeNavigation
          currentIndex={currentStepIndex}
          totalSteps={totalSteps}
          onPrev={prevStep}
          onNext={nextStep}
          onFinish={exitCookMode}
        />
        <CookModeIngredientDrawer recipe={recipe} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[350px_1fr] flex-1 overflow-hidden">
        {/* Left sidebar - ingredients */}
        <CookModeIngredientSidebar recipe={recipe} />

        {/* Right content - step and navigation */}
        <div className="flex flex-col overflow-hidden">
          <CookModeStep step={currentStep} recipe={recipe} />
          <CookModeNavigation
            currentIndex={currentStepIndex}
            totalSteps={totalSteps}
            onPrev={prevStep}
            onNext={nextStep}
            onFinish={exitCookMode}
          />
        </div>
      </div>
    </div>
  )
}
