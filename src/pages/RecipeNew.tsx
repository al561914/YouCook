import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeForm, type RecipeFormData } from '@/components/recipes/RecipeForm'
import { ImportModal } from '@/components/import'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useCookbooks } from '@/hooks/useCookbooks'
import { useRecipes } from '@/hooks/useRecipes'
import { useAuthStore } from '@/stores/authStore'
import { uploadBase64Image } from '@/services/media'

export function RecipeNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultCookbookId = searchParams.get('cookbook') || undefined

  const { user } = useAuthStore()
  const { cookbooks, loading: cookbooksLoading } = useCookbooks()
  const { createRecipe } = useRecipes()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importedData, setImportedData] = useState<any>(null) // Changed to any to include thumbnail_url

  const handleSubmit = async (data: RecipeFormData) => {
    setSubmitting(true)
    setError(null)

    try {
      // Determine source type based on import metadata
      let sourceType: 'manual' | 'pdf' | 'image' | 'url' | 'social' = 'manual'
      if (importedData?.import_metadata) {
        const method = importedData.import_metadata.method
        if (method === 'pdf') sourceType = 'pdf'
        else if (method === 'photo') sourceType = 'image'
        else if (method === 'social') sourceType = 'social'
      }

      const recipe = await createRecipe(data, {
        source_url: importedData?.source_url,
        import_metadata: importedData?.import_metadata,
        source_type: sourceType,
      })

      // If there's a thumbnail base64 from social import, upload it
      console.log('Import metadata:', importedData)
      console.log('Thumbnail base64 available:', !!importedData?.thumbnail_base64)
      if (importedData?.thumbnail_base64 && importedData?.thumbnail_mime_type && user) {
        console.log('Attempting to upload thumbnail, size:', importedData.thumbnail_base64.length, 'chars')
        try {
          const media = await uploadBase64Image(
            user.id,
            recipe.id,
            importedData.thumbnail_base64,
            importedData.thumbnail_mime_type,
            `Imported from ${importedData.import_metadata?.platform || 'social media'}`
          )
          console.log('Successfully uploaded thumbnail:', media)
        } catch (err) {
          console.error('Failed to upload Instagram thumbnail:', err)
          // Don't fail the whole import if thumbnail fails
        }
      } else {
        console.log('No thumbnail base64 to upload:', {
          hasBase64: !!importedData?.thumbnail_base64,
          hasMimeType: !!importedData?.thumbnail_mime_type,
          hasUser: !!user
        })
      }

      navigate(`/recipes/${recipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe')
      setSubmitting(false)
    }
  }

  const handleImportRecipe = (extractedRecipe: any) => {
    // Convert extracted recipe to RecipeFormData format
    const formData: RecipeFormData = {
      title: extractedRecipe.title,
      description: extractedRecipe.description || '',
      cookbookId: defaultCookbookId || '',
      servings: extractedRecipe.servings,
      prepTimeMinutes: extractedRecipe.prep_time_minutes,
      cookTimeMinutes: extractedRecipe.cook_time_minutes,
      difficulty: 'medium', // Default difficulty
      rawIngredientsText: extractedRecipe.raw_ingredients_text,
      rawProcedureText: extractedRecipe.raw_procedure_text,
    }

    // Store the full extracted recipe (includes thumbnail data, import_metadata, etc.)
    setImportedData({
      ...formData,
      thumbnail_url: extractedRecipe.thumbnail_url,
      thumbnail_base64: extractedRecipe.thumbnail_base64,
      thumbnail_mime_type: extractedRecipe.thumbnail_mime_type,
      import_metadata: extractedRecipe.import_metadata,
      source_url: extractedRecipe.source_url,
    })
    setImportModalOpen(false)
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
      <div className="flex items-center justify-between gap-4">
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
        {hasCookbooks && (
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            disabled={submitting}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
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
          importedData={importedData}
        />
      )}

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onRecipeExtracted={handleImportRecipe}
      />
    </div>
  )
}
