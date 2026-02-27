import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogEntryRow } from './LogEntryRow'
import { AddFoodDialog } from './AddFoodDialog'
import type { NutritionLogEntry, NutritionLogEntryInsert } from '@/types/nutritionLog'

interface MealSectionProps {
  mealName: string
  entries: NutritionLogEntry[]
  date: Date
  onEntryAdded: (entry: Omit<NutritionLogEntryInsert, 'user_id' | 'date'>) => Promise<void>
  onEntryDeleted: (id: string) => Promise<void>
  onEntryUpdated: (
    id: string,
    updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>>
  ) => Promise<void>
}

export function MealSection({
  mealName,
  entries,
  onEntryAdded,
  onEntryDeleted,
  onEntryUpdated,
}: MealSectionProps) {
  const [addOpen, setAddOpen] = useState(false)

  const mealCalories = entries.reduce((sum, e) => sum + (e.calories ?? 0), 0)
  const mealProtein = entries.reduce((sum, e) => sum + (e.protein_g ?? 0), 0)
  const mealCarbs = entries.reduce((sum, e) => sum + (e.carbs_g ?? 0), 0)
  const mealFat = entries.reduce((sum, e) => sum + (e.fat_g ?? 0), 0)

  const handleAdded = async (entry: {
    food_id: string
    display_name: string
    quantity: number
    unit: string
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    meal_name: string
  }) => {
    await onEntryAdded({
      meal_name: mealName,
      food_id: entry.food_id,
      display_name: entry.display_name,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{mealName}</h3>
          {entries.length > 0 && (
            <span className="text-sm text-gray-500">{Math.round(mealCalories)} kcal</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add food
        </Button>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="px-4">
          {entries.map((entry) => (
            <LogEntryRow
              key={entry.id}
              entry={entry}
              onUpdate={onEntryUpdated}
              onDelete={onEntryDeleted}
              originalNutrients={{
                calories: entry.calories,
                protein_g: entry.protein_g,
                carbs_g: entry.carbs_g,
                fat_g: entry.fat_g,
                perQuantity: entry.quantity,
              }}
            />
          ))}
          {/* Meal totals footer */}
          <div className="flex items-center gap-2 py-2 text-xs font-medium text-gray-500 border-t border-gray-100 mt-1">
            <span className="flex-1">Total</span>
            <div className="hidden sm:flex items-center gap-3 w-36">
              <span>P {Math.round(mealProtein)}g</span>
              <span>C {Math.round(mealCarbs)}g</span>
              <span>F {Math.round(mealFat)}g</span>
            </div>
            <span className="w-16 text-right">{Math.round(mealCalories)} kcal</span>
            <div className="w-7" />
          </div>
        </div>
      )}

      <AddFoodDialog
        mealName={mealName}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={handleAdded}
      />
    </div>
  )
}
