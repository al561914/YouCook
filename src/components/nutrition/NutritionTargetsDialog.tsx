import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNutritionTargets } from '@/hooks/useNutritionLog'
import type { NutritionTargets } from '@/types/nutritionLog'

interface NutritionTargetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NutritionTargetsDialog({ open, onOpenChange }: NutritionTargetsDialogProps) {
  const { targets, saveTargets } = useNutritionTargets()
  const [form, setForm] = useState<Record<keyof NutritionTargets, string>>({
    calorie_target: '',
    protein_g_target: '',
    carbs_g_target: '',
    fat_g_target: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (targets) {
      setForm({
        calorie_target: targets.calorie_target?.toString() ?? '',
        protein_g_target: targets.protein_g_target?.toString() ?? '',
        carbs_g_target: targets.carbs_g_target?.toString() ?? '',
        fat_g_target: targets.fat_g_target?.toString() ?? '',
      })
    }
  }, [targets])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveTargets({
        calorie_target: form.calorie_target ? Number(form.calorie_target) : null,
        protein_g_target: form.protein_g_target ? Number(form.protein_g_target) : null,
        carbs_g_target: form.carbs_g_target ? Number(form.carbs_g_target) : null,
        fat_g_target: form.fat_g_target ? Number(form.fat_g_target) : null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof NutritionTargets, label: string, unit: string) => (
    <div className="flex items-center gap-3">
      <label className="w-28 text-sm font-medium text-gray-700 flex-shrink-0">{label}</label>
      <div className="relative flex-1">
        <Input
          type="number"
          min={0}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder="No target"
          className="pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{unit}</span>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Daily Targets</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {field('calorie_target', 'Calories', 'kcal')}
          {field('protein_g_target', 'Protein', 'g')}
          {field('carbs_g_target', 'Carbs', 'g')}
          {field('fat_g_target', 'Fat', 'g')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
