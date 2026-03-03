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

type UnitMode = 'serving' | 'unit'

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

function formatServings(n: number): string {
  if (n === 0) return '0'
  const fixed = parseFloat(n.toFixed(2))
  return fixed % 1 === 0 ? fixed.toString() : fixed.toString()
}

export function AddFoodDialog({ mealName, open, onOpenChange, onAdded }: AddFoodDialogProps) {
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<UnitMode>('serving')
  const [adding, setAdding] = useState(false)

  const servingSize = selectedFood?.servingSize ?? null

  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food)
    setQuantity('1')
    setUnit('serving')
  }

  const handleCancel = () => {
    setSelectedFood(null)
  }

  const handleClose = () => {
    setSelectedFood(null)
    setQuantity('1')
    setUnit('serving')
    onOpenChange(false)
  }

  const servingUnit = selectedFood?.servingUnit ?? 'g'

  const handleUnitSwitch = (newUnit: UnitMode) => {
    if (newUnit === unit || servingSize === null) return
    const current = parseFloat(quantity) || 1
    if (newUnit === 'unit') {
      setQuantity(Math.round(current * servingSize).toString())
    } else {
      setQuantity(formatServings(current / servingSize))
    }
    setUnit(newUnit)
  }

  const qty = parseFloat(quantity) || 0
  const servingsForCalc = unit === 'serving' ? qty : (servingSize ? qty / servingSize : qty)
  const preview = selectedFood && qty > 0 ? scaleNutrients(selectedFood, servingsForCalc) : null

  // Equivalent label shown next to the input
  const equivalent = servingSize
    ? unit === 'serving'
      ? `= ${Math.round(qty * servingSize)}${servingUnit}`
      : `= ${formatServings(qty / servingSize)} serving${qty / servingSize !== 1 ? 's' : ''}`
    : null

  const servingLabel = selectedFood
    ? selectedFood.servingDescription ?? `${servingSize ?? 100}${selectedFood.servingUnit ?? 'g'}`
    : ''

  const handleAdd = async () => {
    if (!selectedFood || !preview || qty <= 0) return
    setAdding(true)
    try {
      await onAdded({
        food_id: selectedFood.id,
        display_name: selectedFood.name + (selectedFood.brand ? ` (${selectedFood.brand})` : ''),
        quantity: qty,
        unit: unit === 'serving' ? 'serving' : servingUnit,
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
            {/* Food info */}
            <div>
              <p className="font-medium text-gray-900">{selectedFood.name}</p>
              {selectedFood.brand && (
                <p className="text-sm text-gray-500">{selectedFood.brand}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">1 serving = {servingLabel}</p>
            </div>

            {/* Quantity + unit toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  step={unit === 'serving' ? 0.25 : 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-24"
                  autoFocus
                />

                {/* Segmented toggle: only show 'g' option when servingSize is known */}
                <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => handleUnitSwitch('serving')}
                    className={`px-3 py-1.5 transition-colors ${
                      unit === 'serving'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    serving
                  </button>
                  {servingSize !== null && (
                    <button
                      type="button"
                      onClick={() => handleUnitSwitch('unit')}
                      className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${
                        unit === 'unit'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {servingUnit}
                    </button>
                  )}
                </div>

                {equivalent && (
                  <span className="text-sm text-gray-400">{equivalent}</span>
                )}
              </div>
            </div>

            {/* Macro preview */}
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
              <Button onClick={handleAdd} disabled={adding || qty <= 0}>
                {adding ? 'Adding...' : 'Add to Log'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
