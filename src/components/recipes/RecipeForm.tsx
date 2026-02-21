import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ImageGallery } from './ImageGallery'
import { ImageUpload } from './ImageUpload'
import { NutritionSummary } from './NutritionSummary'
import { TagEditor } from './TagEditor'
import type { Cookbook } from '@/types/cookbook'
import type { RecipeWithRelations } from '@/types/recipe'

export interface RecipeFormData {
  title: string
  description: string
  cookbookId: string
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  rawIngredientsText: string
  rawProcedureText: string
  tags: string[]
}

interface RecipeFormProps {
  cookbooks: Cookbook[]
  onSubmit: (data: RecipeFormData) => Promise<void>
  recipe?: RecipeWithRelations | null
  defaultCookbookId?: string
  loading?: boolean
  onRefresh?: () => void
  importedData?: RecipeFormData | null
}

export function RecipeForm({
  cookbooks,
  onSubmit,
  recipe,
  defaultCookbookId,
  loading = false,
  onRefresh,
  importedData,
}: RecipeFormProps) {
  const isEditing = !!recipe

  // Collapsible section states
  const [ingredientsOpen, setIngredientsOpen] = useState(true)
  const [instructionsOpen, setInstructionsOpen] = useState(true)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [nutritionOpen, setNutritionOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormData>({
    defaultValues: {
      title: '',
      description: '',
      cookbookId: defaultCookbookId || '',
      servings: 4,
      prepTimeMinutes: null,
      cookTimeMinutes: null,
      difficulty: 'medium',
      rawIngredientsText: '',
      rawProcedureText: '',
      tags: [],
    },
  })

  const selectedDifficulty = watch('difficulty')
  const selectedCookbook = watch('cookbookId')
  const selectedTags = watch('tags')

  useEffect(() => {
    if (recipe) {
      reset({
        title: recipe.title,
        description: recipe.description || '',
        cookbookId: recipe.cookbook_id,
        servings: recipe.servings,
        prepTimeMinutes: recipe.prep_time_minutes,
        cookTimeMinutes: recipe.cook_time_minutes,
        difficulty: recipe.difficulty,
        rawIngredientsText: recipe.raw_ingredients_text || '',
        rawProcedureText: recipe.raw_procedure_text || '',
        tags: (recipe as any).tags || [],
      })
    } else if (importedData) {
      reset(importedData)
    } else if (defaultCookbookId) {
      setValue('cookbookId', defaultCookbookId)
    }
  }, [recipe, importedData, defaultCookbookId, reset, setValue])

  const handleFormSubmit = async (data: RecipeFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for your recipe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Grandma's Apple Pie"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description of your recipe..."
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cookbook">Cookbook *</Label>
            <Select
              value={selectedCookbook}
              onValueChange={(value) => setValue('cookbookId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cookbook" />
              </SelectTrigger>
              <SelectContent>
                {cookbooks.map((cookbook) => (
                  <SelectItem key={cookbook.id} value={cookbook.id}>
                    {cookbook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cookbookId && (
              <p className="text-sm text-red-600">{errors.cookbookId.message}</p>
            )}
            {cookbooks.length === 0 && (
              <p className="text-sm text-amber-600">
                You need to create a cookbook first before adding recipes.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                max={100}
                {...register('servings', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time (min)</Label>
              <Input
                id="prepTime"
                type="number"
                min={0}
                placeholder="0"
                {...register('prepTimeMinutes', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTime">Cook Time (min)</Label>
              <Input
                id="cookTime"
                type="number"
                min={0}
                placeholder="0"
                {...register('cookTimeMinutes', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={selectedDifficulty}
                onValueChange={(value) => setValue('difficulty', value as RecipeFormData['difficulty'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {ingredientsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    Ingredients
                  </CardTitle>
                  <CardDescription>
                    Enter your ingredients as free-form text, one per line. The AI will parse them automatically.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Textarea
                id="ingredients"
                placeholder={`2 cups all-purpose flour
1 tsp salt
1/2 cup butter, softened
3 large eggs
1 cup milk`}
                rows={8}
                className="font-mono text-sm"
                {...register('rawIngredientsText', { required: 'Ingredients are required' })}
              />
              {errors.rawIngredientsText && (
                <p className="text-sm text-red-600 mt-2">{errors.rawIngredientsText.message}</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Instructions */}
      <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {instructionsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    Instructions
                  </CardTitle>
                  <CardDescription>
                    Enter your cooking instructions. You can use numbered steps or plain paragraphs.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Textarea
                id="instructions"
                placeholder={`1. Preheat oven to 350°F (175°C).

2. In a large bowl, mix flour and salt together.

3. Add softened butter and mix until crumbly.

4. Beat eggs with milk, then add to the flour mixture.

5. Bake for 25-30 minutes until golden brown.`}
                rows={10}
                className="font-mono text-sm"
                {...register('rawProcedureText', { required: 'Instructions are required' })}
              />
              {errors.rawProcedureText && (
                <p className="text-sm text-red-600 mt-2">{errors.rawProcedureText.message}</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tags */}
      <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {tagsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    Tags
                    {selectedTags.length > 0 && (
                      <span className="text-sm font-normal text-blue-600">({selectedTags.length} selected)</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Classify your recipe for easy filtering and search
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <TagEditor
                value={selectedTags}
                onChange={(tags) => setValue('tags', tags)}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Photos - Only show when editing */}
      {isEditing && recipe && (
        <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {photosOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      Photos
                    </CardTitle>
                    <CardDescription>
                      Upload and manage recipe photos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <ImageGallery
                  media={recipe.media || []}
                  editable
                  onDelete={onRefresh}
                />
                <ImageUpload
                  recipeId={recipe.id}
                  onUpload={onRefresh || (() => {})}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Nutrition - Only show when editing and has ingredients */}
      {isEditing && recipe && recipe.ingredients && recipe.ingredients.length > 0 && (
        <Collapsible open={nutritionOpen} onOpenChange={setNutritionOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {nutritionOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      Nutrition
                    </CardTitle>
                    <CardDescription>
                      Auto-calculated from matched ingredients
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <NutritionSummary
                  ingredients={recipe.ingredients}
                  servings={recipe.servings || 1}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading || cookbooks.length === 0}>
          {loading ? 'Saving...' : isEditing ? 'Update Recipe' : 'Create Recipe'}
        </Button>
      </div>
    </form>
  )
}
