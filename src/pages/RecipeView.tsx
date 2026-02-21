import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Edit, Trash2, Users, ChefHat, AlertCircle, Sparkles, RotateCw, ExternalLink, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common'
import { IngredientList, NutritionSummary, ImageGallery, ImageUpload, ServingAdjuster, HeroImage, StepsList, TagBadge } from '@/components/recipes'
import { useRecipe, useRecipes } from '@/hooks/useRecipes'
import { parseRecipe } from '@/services/parsing'
import { DIFFICULTY_LABELS, PARSING_STATUS_LABELS } from '@/lib/constants'

export function RecipeView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipe, loading, error, refresh } = useRecipe(id)
  const { deleteRecipe } = useRecipes()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Serving adjustment state
  const [currentServings, setCurrentServings] = useState<number>(recipe?.servings || 1)
  const servingMultiplier = useMemo(() => {
    const base = recipe?.servings || 1
    return base > 0 ? currentServings / base : 1
  }, [currentServings, recipe?.servings])

  // Ingredient checkboxes state
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients')

  // Reset state when recipe changes
  useEffect(() => {
    if (recipe) {
      setCurrentServings(recipe.servings || 1)
      setCheckedIngredients(new Set())
    }
  }, [recipe?.id])

  const toggleIngredient = useCallback((ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      return next
    })
  }, [])

  const handleParse = useCallback(async () => {
    if (!id) return
    setParsing(true)
    setParseError(null)

    try {
      await parseRecipe(id)
      await refresh()
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse recipe')
    } finally {
      setParsing(false)
    }
  }, [id, refresh])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteRecipe(id)
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to delete recipe:', err)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error || 'Recipe not found'}
        </div>
      </div>
    )
  }

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={"/cookbooks/" + recipe.cookbook_id}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
            {recipe.description && (
              <p className="mt-1 text-gray-600">{recipe.description}</p>
            )}
            {((recipe as any).tags?.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {((recipe as any).tags as string[]).map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
            {recipe.source_url && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                {(recipe as any).import_metadata?.platform === 'instagram' && (
                  <div className="flex items-center justify-center h-4 w-4 rounded bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <Instagram className="h-3 w-3 text-white" />
                  </div>
                )}
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  View original {(recipe as any).import_metadata?.platform || 'source'}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {(recipe as any).import_metadata?.author && (
                  <span className="text-gray-500">by @{(recipe as any).import_metadata.author}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="hidden lg:flex" asChild>
            <Link to={`/recipes/${id}/cook`}>
              <ChefHat className="mr-2 h-4 w-4" />
              Cook
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={"/recipes/" + id + "/edit"}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {parseError && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          <p className="font-medium">Parsing Error</p>
          <p className="text-sm">{parseError}</p>
        </div>
      )}

      {recipe.parsing_status !== 'parsed' ? (
        <div className="rounded-md p-4 flex items-center justify-between gap-4 bg-blue-50 text-blue-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">{PARSING_STATUS_LABELS[recipe.parsing_status]}</p>
              <p className="text-sm opacity-80">
                {recipe.parsing_status === 'pending' && 'This recipe is waiting to be parsed by AI.'}
                {recipe.parsing_status === 'parsing' && 'AI is currently parsing this recipe...'}
                {recipe.parsing_status === 'review_needed' && 'Some ingredients need your review.'}
                {recipe.parsing_status === 'failed' && (recipe.parsing_error || 'Failed to parse recipe.')}
              </p>
            </div>
          </div>
          {(recipe.parsing_status === 'pending' || recipe.parsing_status === 'failed') && (
            <Button
              onClick={handleParse}
              disabled={parsing}
              size="sm"
              className="flex-shrink-0"
            >
              {parsing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse with AI
                </>
              )}
            </Button>
          )}
        </div>
      ) : (recipe.raw_ingredients_text || recipe.raw_procedure_text) && (
        <div className="flex justify-end">
          <Button
            onClick={handleParse}
            disabled={parsing}
            variant="outline"
            size="sm"
          >
            {parsing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Re-parsing...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Re-parse with AI
              </>
            )}
          </Button>
        </div>
      )}

      {/* MOBILE LAYOUT - Hidden on desktop */}
      <div className="lg:hidden space-y-6">
        <HeroImage media={recipe.media} title={recipe.title} />

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {totalTime} min
          </Badge>
          <ServingAdjuster
            currentServings={currentServings}
            onServingsChange={setCurrentServings}
            variant="compact"
          />
          {recipe.difficulty && (
            <Badge variant="outline" className="text-sm">
              <ChefHat className="mr-1 h-3 w-3" />
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </Badge>
          )}
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nutrition</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionSummary
                ingredients={recipe.ingredients}
                servings={recipe.servings || 1}
                currentServings={currentServings}
              />
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ingredients' | 'steps')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  <IngredientList
                    ingredients={recipe.ingredients}
                    servingMultiplier={servingMultiplier}
                    checkable
                    checkedIngredients={checkedIngredients}
                    onToggleIngredient={toggleIngredient}
                    editable={recipe.parsing_status === 'parsed'}
                    onUpdate={refresh}
                  />
                ) : recipe.raw_ingredients_text ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 italic">Raw ingredients (not yet parsed):</p>
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-3 rounded-md">
                      {recipe.raw_ingredients_text}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No ingredients listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <StepsList steps={recipe.steps} rawProcedureText={recipe.raw_procedure_text} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button className="w-full" size="lg" asChild>
          <Link to={`/recipes/${id}/cook`}>
            <ChefHat className="mr-2 h-5 w-5" />
            Start Cooking
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageGallery media={recipe.media || []} editable onDelete={refresh} />
            <div className="mt-4">
              <ImageUpload recipeId={recipe.id} onUpload={refresh} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DESKTOP LAYOUT - Hidden on mobile */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <HeroImage media={recipe.media} title={recipe.title} />

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {totalTime} min
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {currentServings} {currentServings === 1 ? 'serving' : 'servings'}
            </Badge>
            {recipe.difficulty && (
              <Badge variant="outline">
                <ChefHat className="mr-1 h-3 w-3" />
                {DIFFICULTY_LABELS[recipe.difficulty]}
              </Badge>
            )}
          </div>

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Nutrition</CardTitle>
              </CardHeader>
              <CardContent>
                <NutritionSummary
                  ingredients={recipe.ingredients}
                  servings={recipe.servings || 1}
                  currentServings={currentServings}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageGallery media={recipe.media || []} editable onDelete={refresh} />
              <div className="mt-4">
                <ImageUpload recipeId={recipe.id} onUpload={refresh} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Ingredients</CardTitle>
                <CardDescription>{recipe.ingredients?.length || 0} ingredients</CardDescription>
              </div>
              <ServingAdjuster
                currentServings={currentServings}
                onServingsChange={setCurrentServings}
                variant="inline"
              />
            </CardHeader>
            <CardContent>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <IngredientList
                  ingredients={recipe.ingredients}
                  servingMultiplier={servingMultiplier}
                  checkable
                  checkedIngredients={checkedIngredients}
                  onToggleIngredient={toggleIngredient}
                  editable={recipe.parsing_status === 'parsed'}
                  onUpdate={refresh}
                />
              ) : recipe.raw_ingredients_text ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 italic">Raw ingredients (not yet parsed):</p>
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-3 rounded-md">
                    {recipe.raw_ingredients_text}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ingredients listed</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>{recipe.steps?.length || 0} steps</CardDescription>
            </CardHeader>
            <CardContent>
              <StepsList steps={recipe.steps} rawProcedureText={recipe.raw_procedure_text} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Recipe"
        description="Are you sure you want to delete this recipe? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
