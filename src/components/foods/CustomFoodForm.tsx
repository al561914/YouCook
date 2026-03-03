import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FoodWithNutrients } from '@/types/food'

export interface CustomFoodFormData {
  name: string
  brand?: string
  servingSize?: number
  servingUnit?: string
  servingDescription?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
}

interface CustomFoodFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CustomFoodFormData) => Promise<void>
  food?: FoodWithNutrients | null
  loading?: boolean
}

export function CustomFoodForm({ open, onOpenChange, onSubmit, food, loading = false }: CustomFoodFormProps) {
  const isEditing = !!food

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomFoodFormData>({
    defaultValues: {
      name: '',
      brand: '',
      servingSize: 100,
      servingUnit: 'g',
      servingDescription: '',
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    },
  })

  useEffect(() => {
    if (food) {
      const nutrients = food.food_nutrients?.[0]
      reset({
        name: food.name,
        brand: food.brand || '',
        servingSize: food.serving_size || 100,
        servingUnit: food.serving_unit || 'g',
        servingDescription: food.serving_description || '',
        calories: nutrients?.calories || 0,
        protein_g: nutrients?.protein_g || 0,
        carbs_g: nutrients?.carbs_g || 0,
        fat_g: nutrients?.fat_g || 0,
        fiber_g: nutrients?.fiber_g || 0,
        sugar_g: nutrients?.sugar_g || 0,
        sodium_mg: nutrients?.sodium_mg || 0,
      })
    } else {
      reset({
        name: '',
        brand: '',
        servingSize: 100,
        servingUnit: 'g',
        servingDescription: '',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
      })
    }
  }, [food, reset])

  const handleFormSubmit = async (data: CustomFoodFormData) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Custom Food' : 'Add Custom Food'}
            {food?.original_source && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                (Originally from {food.original_source === 'openfoodfacts' ? 'Open Food Facts' : food.original_source.toUpperCase()})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Food Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Chicken Breast"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand (optional)</Label>
              <Input
                id="brand"
                placeholder="e.g., Organic Valley"
                {...register('brand')}
              />
            </div>

            {food?.external_id && (
              <div className="space-y-2">
                <Label htmlFor="upc">UPC / Barcode</Label>
                <Input
                  id="upc"
                  value={food.external_id}
                  readOnly
                  disabled
                  className="bg-gray-50 font-mono text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servingSize">Serving Size</Label>
                <Input
                  id="servingSize"
                  type="number"
                  step="0.1"
                  placeholder="100"
                  {...register('servingSize', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servingUnit">Unit</Label>
                <Input
                  id="servingUnit"
                  placeholder="g"
                  {...register('servingUnit')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingDescription">Portion Label <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                id="servingDescription"
                placeholder="e.g., 1 container, 1 slice, 2 tbsp"
                {...register('servingDescription')}
              />
              <p className="text-xs text-gray-400">Shown as "Per …" on the food card (e.g., Per 1 slice (28g))</p>
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Nutrition Information</h3>
            <p className="text-sm text-gray-500">
              Enter nutrition values per serving size
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  step="1"
                  placeholder="0"
                  {...register('calories', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="protein_g">Protein (g)</Label>
                <Input
                  id="protein_g"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('protein_g', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbs_g">Carbohydrates (g)</Label>
                <Input
                  id="carbs_g"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('carbs_g', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat_g">Fat (g)</Label>
                <Input
                  id="fat_g"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('fat_g', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiber_g">Fiber (g)</Label>
                <Input
                  id="fiber_g"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('fiber_g', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sugar_g">Sugar (g)</Label>
                <Input
                  id="sugar_g"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register('sugar_g', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sodium_mg">Sodium (mg)</Label>
                <Input
                  id="sodium_mg"
                  type="number"
                  step="1"
                  placeholder="0"
                  {...register('sodium_mg', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Food' : 'Create Food'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
