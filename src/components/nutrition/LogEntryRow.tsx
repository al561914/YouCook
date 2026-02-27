import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NutritionLogEntry } from '@/types/nutritionLog'

interface LogEntryRowProps {
  entry: NutritionLogEntry
  onUpdate: (id: string, updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  originalNutrients?: {
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    perQuantity: number
  }
}

export function LogEntryRow({ entry, onUpdate, onDelete, originalNutrients }: LogEntryRowProps) {
  const [editingQty, setEditingQty] = useState(false)
  const [qtyValue, setQtyValue] = useState(entry.quantity.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  const handleQtyClick = () => {
    setQtyValue(entry.quantity.toString())
    setEditingQty(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleQtyBlur = async () => {
    const newQty = parseFloat(qtyValue)
    if (isNaN(newQty) || newQty <= 0) {
      setQtyValue(entry.quantity.toString())
      setEditingQty(false)
      return
    }
    if (newQty !== entry.quantity) {
      const updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>> = { quantity: newQty }
      if (originalNutrients) {
        const scale = newQty / originalNutrients.perQuantity
        updates.calories = originalNutrients.calories !== null ? originalNutrients.calories * scale : null
        updates.protein_g = originalNutrients.protein_g !== null ? originalNutrients.protein_g * scale : null
        updates.carbs_g = originalNutrients.carbs_g !== null ? originalNutrients.carbs_g * scale : null
        updates.fat_g = originalNutrients.fat_g !== null ? originalNutrients.fat_g * scale : null
      }
      await onUpdate(entry.id, updates)
    }
    setEditingQty(false)
  }

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setQtyValue(entry.quantity.toString())
      setEditingQty(false)
    }
  }

  return (
    <div className="flex items-center gap-2 py-2 text-sm border-b border-gray-100 last:border-0">
      <span className="flex-1 text-gray-800 truncate">{entry.display_name}</span>
      <div className="flex items-center gap-1 text-gray-600 flex-shrink-0">
        {editingQty ? (
          <input
            ref={inputRef}
            type="number"
            min={0.1}
            step={0.1}
            value={qtyValue}
            onChange={(e) => setQtyValue(e.target.value)}
            onBlur={handleQtyBlur}
            onKeyDown={handleQtyKeyDown}
            className="w-16 border border-blue-400 rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <button
            onClick={handleQtyClick}
            className="w-10 text-center hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer"
            title="Click to edit quantity"
          >
            {entry.quantity % 1 === 0 ? entry.quantity : entry.quantity.toFixed(1)}
          </button>
        )}
        <span className="text-gray-400">{entry.unit}</span>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 flex-shrink-0 w-36">
        <span>P {Math.round(entry.protein_g ?? 0)}g</span>
        <span>C {Math.round(entry.carbs_g ?? 0)}g</span>
        <span>F {Math.round(entry.fat_g ?? 0)}g</span>
      </div>
      <span className="text-sm font-medium text-gray-700 flex-shrink-0 w-16 text-right">
        {Math.round(entry.calories ?? 0)} kcal
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-400 hover:text-red-500 flex-shrink-0"
        onClick={() => onDelete(entry.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
