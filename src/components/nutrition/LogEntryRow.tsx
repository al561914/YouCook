import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const [editOpen, setEditOpen] = useState(false)
  const [editQty, setEditQty] = useState(entry.quantity.toString())
  const [saving, setSaving] = useState(false)

  const perUnit = originalNutrients && originalNutrients.perQuantity > 0
    ? {
        calories: (originalNutrients.calories ?? 0) / originalNutrients.perQuantity,
        protein_g: (originalNutrients.protein_g ?? 0) / originalNutrients.perQuantity,
        carbs_g: (originalNutrients.carbs_g ?? 0) / originalNutrients.perQuantity,
        fat_g: (originalNutrients.fat_g ?? 0) / originalNutrients.perQuantity,
      }
    : null

  const previewQty = parseFloat(editQty) || 0
  const preview = perUnit && previewQty > 0
    ? {
        calories: perUnit.calories * previewQty,
        protein_g: perUnit.protein_g * previewQty,
        carbs_g: perUnit.carbs_g * previewQty,
        fat_g: perUnit.fat_g * previewQty,
      }
    : null

  const handleOpenEdit = () => {
    setEditQty(entry.quantity.toString())
    setEditOpen(true)
  }

  const handleSave = async () => {
    const newQty = parseFloat(editQty)
    if (isNaN(newQty) || newQty <= 0) return

    setSaving(true)
    try {
      const updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>> = {
        quantity: newQty,
      }
      if (perUnit) {
        updates.calories = perUnit.calories * newQty
        updates.protein_g = perUnit.protein_g * newQty
        updates.carbs_g = perUnit.carbs_g * newQty
        updates.fat_g = perUnit.fat_g * newQty
      }
      await onUpdate(entry.id, updates)
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 py-2 text-sm border-b border-gray-100 last:border-0">
        <span className="flex-1 text-gray-800 truncate">{entry.display_name}</span>
        <span className="text-gray-600 flex-shrink-0">
          {entry.quantity % 1 === 0 ? entry.quantity : entry.quantity.toFixed(1)} {entry.unit}
        </span>
        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 flex-shrink-0 w-36">
          <span>P {Math.round(entry.protein_g ?? 0)}g</span>
          <span>C {Math.round(entry.carbs_g ?? 0)}g</span>
          <span>F {Math.round(entry.fat_g ?? 0)}g</span>
        </div>
        <span className="text-sm font-medium text-gray-700 flex-shrink-0 w-16 text-right">
          {Math.round(entry.calories ?? 0)} kcal
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 flex-shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">{entry.display_name}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600">Quantity ({entry.unit})</label>
              <Input
                type="number"
                min={0.1}
                step={entry.unit === 'serving' ? 0.25 : 1}
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                autoFocus
              />
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || previewQty <= 0}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
