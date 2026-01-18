import { FoodCard } from './FoodCard'
import type { FoodSearchResult, FoodWithNutrients } from '@/types/food'

interface FoodListProps {
  foods: (FoodSearchResult | FoodWithNutrients)[]
  onEdit?: (food: any) => void
  onDelete?: (food: any) => void
  onSelect?: (food: any) => void
  onSave?: (food: any) => void
  selectable?: boolean
  showSaveButton?: boolean
  emptyMessage?: string
}

export function FoodList({
  foods,
  onEdit,
  onDelete,
  onSelect,
  onSave,
  selectable = false,
  showSaveButton = false,
  emptyMessage = 'No foods found',
}: FoodListProps) {
  if (foods.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {foods.map((food) => (
        <FoodCard
          key={food.id}
          food={food}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          onSave={onSave}
          selectable={selectable}
          showSaveButton={showSaveButton}
        />
      ))}
    </div>
  )
}
