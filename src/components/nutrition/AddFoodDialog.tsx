import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FoodSearch } from '@/components/foods/FoodSearch'
import { scaleNutrients } from '@/hooks/useNutritionLog'
import type { FoodSearchResult } from '@/types/food'

interface AddFoodDialogProps {
  mealName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (entry: {
    food_id: string
    display_name: string
    quantity: number
    unit: string
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    meal_name: string
  }) => Promise<void>
}

export function AddFoodDialog({ mealName, open, onOpenChange, onAdded }: AddFoodDialogProps) {
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [adding, setAdding] = useState(false)

  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food)
    setQuantity('1')
  }

  const handleCancel = () => {
    setSelectedFood(null)
  }

  const handleClose = () => {
    setSelectedFood(null)
    setQuantity('1')
    onOpenChange(false)
  }

  const qty = parseFloat(quantity) || 1
  const preview = selectedFood ? scaleNutrients(selectedFood, qty) : null

  const servingLabel = selectedFood
    ? selectedFood.servingDescription ?? `${selectedFood.servingSize ?? 100}${selectedFood.servingUnit ?? 'g'}`
    : ''

  const handleAdd = async () => {
    if (!selectedFood || !preview) return
    setAdding(true)
    try {
      await onAdded({
        food_id: selectedFood.id,
        display_name: selectedFood.name + (selectedFood.brand ? ` (${selectedFood.brand})` : ''),
        quantity: qty,
        unit: 'serving',
        calories: preview.calories,
        protein_g: preview.protein_g,
        carbs_g: preview.carbs_g,
        fat_g: preview.fat_g,
        meal_name: mealName,
      })
      handleClose()
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Food — {mealName}</DialogTitle>
        </DialogHeader>

        {!selectedFood ? (
          <FoodSearch
            onSelect={handleFoodSelect}
            onCancel={handleClose}
            localOnly
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">{selectedFood.name}</p>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500">{selectedFood.brand}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{servingLabel} per serving</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-20">Quantity</label>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-24"
                autoFocus
              />
              <span className="text-sm text-gray-500">serving(s)</span>
            </div>

            {preview && (
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="font-semibold text-orange-600">{Math.round(preview.calories)}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">{Math.round(preview.protein_g)}g</p>
                  <p className="text-xs text-gray-500">protein</p>
                </div>
                <div>
                  <p className="font-semibold text-yellow-600">{Math.round(preview.carbs_g)}g</p>
                  <p className="text-xs text-gray-500">carbs</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">{Math.round(preview.fat_g)}g</p>
                  <p className="text-xs text-gray-500">fat</p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>Back</Button>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? 'Adding...' : 'Add to Log'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
