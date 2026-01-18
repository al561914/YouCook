import { MoreVertical, Pencil, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FoodSearchResult, FoodWithNutrients } from '@/types/food'

interface FoodCardProps {
  food: FoodSearchResult | FoodWithNutrients
  onEdit?: (food: any) => void
  onDelete?: (food: any) => void
  onSelect?: (food: any) => void
  onSave?: (food: any) => void
  selectable?: boolean
  showSaveButton?: boolean
}

export function FoodCard({ food, onEdit, onDelete, onSelect, onSave, selectable = false, showSaveButton = false }: FoodCardProps) {
  const nutrients = 'nutrients' in food ? food.nutrients : (food as FoodWithNutrients).food_nutrients?.[0]
  const isCustomFood = food.source === 'user' // Only truly custom foods can be edited
  const isSavedFood = 'user_id' in food && food.user_id // Saved API food or custom food
  const isApiFood = food.source === 'usda' || food.source === 'openfoodfacts'
  const source = food.source || 'unknown'
  const originalSource = 'original_source' in food ? food.original_source : null

  // Get serving size
  const servingSize = 'servingSize' in food ? food.servingSize : (food as FoodWithNutrients).serving_size
  const servingUnit = 'servingUnit' in food ? food.servingUnit : (food as FoodWithNutrients).serving_unit
  const servingDescription = 'servingDescription' in food ? food.servingDescription : (food as FoodWithNutrients).serving_description

  // Get UPC/barcode
  const externalId = 'externalId' in food ? food.externalId : (food as FoodWithNutrients).external_id

  // Generate badge label with origin information
  const getBadgeLabel = () => {
    if (source === 'user' && originalSource) {
      const originName = originalSource === 'openfoodfacts' ? 'Open Food Facts' : originalSource.toUpperCase()
      return `Custom (from ${originName})`
    }
    if (source === 'user') return 'Custom'
    if (source === 'openfoodfacts') return 'Open Food Facts'
    return source.toUpperCase()
  }

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect(food)
    }
  }

  return (
    <Card
      className={`group relative ${selectable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{food.name}</CardTitle>
            {food.brand && (
              <CardDescription className="mt-1">{food.brand}</CardDescription>
            )}
            {externalId && (
              <CardDescription className="mt-1 text-xs font-mono">
                UPC: {externalId}
              </CardDescription>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                source === 'user' ? 'bg-blue-100 text-blue-700' :
                source === 'usda' ? 'bg-green-100 text-green-700' :
                source === 'openfoodfacts' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {getBadgeLabel()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {(servingDescription || servingSize) && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <span className="text-xs text-gray-500">
              Per {servingDescription || `${servingSize}${servingUnit}`}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Calories:</span>{' '}
            <span className="font-medium">{nutrients?.calories ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Protein:</span>{' '}
            <span className="font-medium">{nutrients?.protein_g ? `${nutrients.protein_g}g` : '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Carbs:</span>{' '}
            <span className="font-medium">{nutrients?.carbs_g ? `${nutrients.carbs_g}g` : '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Fat:</span>{' '}
            <span className="font-medium">{nutrients?.fat_g ? `${nutrients.fat_g}g` : '—'}</span>
          </div>
        </div>

        {/* Save button for API foods */}
        {showSaveButton && isApiFood && onSave && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                onSave(food)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Save to Database
            </Button>
          </div>
        )}
      </CardContent>

      {/* Actions dropdown - for saved foods */}
      {isSavedFood && (onEdit || onDelete) && (
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(food)
                }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(food)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isCustomFood ? 'Delete' : 'Remove'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  )
}
