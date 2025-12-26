import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeForm, type RecipeFormData } from '@/components/recipes/RecipeForm'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useCookbooks } from '@/hooks/useCookbooks'
import { useRecipes } from '@/hooks/useRecipes'

export function RecipeNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultCookbookId = searchParams.get('cookbook') || undefined

  const { cookbooks, loading: cookbooksLoading } = useCookbooks()
  const { createRecipe } = useRecipes()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: RecipeFormData) => {
    setSubmitting(true)
    setError(null)

    try {
      const recipe = await createRecipe(data)
      navigate(`/recipes/${recipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe')
      setSubmitting(false)
    }
  }

  // Track if we've ever had cookbooks loaded (prevents form unmount during refetch)
  const [hasCookbooks, setHasCookbooks] = useState(false)

  // Once we know there are cookbooks, remember it to prevent form unmounting
  if (!hasCookbooks && cookbooks.length > 0) {
    setHasCookbooks(true)
  }

  // Only show loading spinner on initial load, not on refetches
  const showLoading = cookbooksLoading && !hasCookbooks

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={defaultCookbookId ? `/cookbooks/${defaultCookbookId}` : '/dashboard'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Recipe</h1>
          <p className="mt-1 text-gray-600">
            Add a new recipe to your collection
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {showLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !hasCookbooks && cookbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-white">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No cookbooks yet</h3>
          <p className="text-gray-500 mt-1 mb-4">
            You need to create a cookbook before adding recipes
          </p>
          <Button asChild>
            <Link to="/cookbooks">Create Cookbook</Link>
          </Button>
        </div>
      ) : (
        <RecipeForm
          cookbooks={cookbooks}
          onSubmit={handleSubmit}
          defaultCookbookId={defaultCookbookId}
          loading={submitting}
        />
      )}
    </div>
  )
}
