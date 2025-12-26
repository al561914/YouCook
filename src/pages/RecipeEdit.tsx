import { useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ListChecks, RotateCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { RecipeForm, type RecipeFormData } from '@/components/recipes/RecipeForm'
import { IngredientReviewModal } from '@/components/recipes/IngredientReviewModal'
import { useCookbooks } from '@/hooks/useCookbooks'
import { useRecipe, useRecipes } from '@/hooks/useRecipes'
import { parseRecipe } from '@/services/parsing'

export function RecipeEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipe, loading: recipeLoading, error: recipeError, refresh } = useRecipe(id)
  const { cookbooks, loading: cookbooksLoading } = useCookbooks()
  const { updateRecipe } = useRecipes()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleSubmit = async (data: RecipeFormData) => {
    if (!id) return

    setSaving(true)
    setError(null)

    try {
      await updateRecipe(id, data)
      navigate(`/recipes/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe')
      setSaving(false)
    }
  }

  const handleParse = useCallback(async () => {
    if (!id) return
    setParsing(true)
    setParseError(null)

    try {
      await parseRecipe(id)
      await refresh()
      // Auto-open review modal after successful parsing
      setShowReviewModal(true)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse recipe')
    } finally {
      setParsing(false)
    }
  }, [id, refresh])

  const loading = recipeLoading || cookbooksLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (recipeError || !recipe) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {recipeError || 'Recipe not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/recipes/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
            <p className="mt-1 text-gray-600">
              Update your recipe details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {recipe?.raw_ingredients_text && recipe?.raw_procedure_text && (
            <Button
              variant="outline"
              onClick={handleParse}
              disabled={parsing}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Re-parse with AI
                </>
              )}
            </Button>
          )}
          {recipe?.ingredients && recipe.ingredients.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowReviewModal(true)}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Review Ingredients
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {parseError && (
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          <p className="font-medium">Parsing Error</p>
          <p className="text-sm">{parseError}</p>
        </div>
      )}

      <RecipeForm
        cookbooks={cookbooks}
        recipe={recipe}
        onSubmit={handleSubmit}
        loading={saving}
        onRefresh={refresh}
      />

      {recipe && recipe.ingredients && (
        <IngredientReviewModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          ingredients={recipe.ingredients}
          onUpdate={refresh}
        />
      )}
    </div>
  )
}
