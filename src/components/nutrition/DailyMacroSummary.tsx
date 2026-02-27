import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MacroProgressBar } from './MacroProgressBar'
import { NutritionTargetsDialog } from './NutritionTargetsDialog'
import { useNutritionTargets } from '@/hooks/useNutritionLog'
import type { DailyMacroSummary as DailyMacroSummaryType } from '@/types/nutritionLog'

interface DailyMacroSummaryProps {
  summary: DailyMacroSummaryType
}

export function DailyMacroSummary({ summary }: DailyMacroSummaryProps) {
  const { targets } = useNutritionTargets()
  const [targetsOpen, setTargetsOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Daily Totals</h2>
          <Button variant="ghost" size="sm" onClick={() => setTargetsOpen(true)} className="text-gray-500 gap-1.5">
            <Target className="h-4 w-4" />
            Set Targets
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MacroProgressBar
            label="Calories"
            value={summary.calories}
            target={targets?.calorie_target ?? null}
            unit=" kcal"
            color="orange"
          />
          <MacroProgressBar
            label="Protein"
            value={summary.protein_g}
            target={targets?.protein_g_target ?? null}
            color="blue"
          />
          <MacroProgressBar
            label="Carbs"
            value={summary.carbs_g}
            target={targets?.carbs_g_target ?? null}
            color="yellow"
          />
          <MacroProgressBar
            label="Fat"
            value={summary.fat_g}
            target={targets?.fat_g_target ?? null}
            color="green"
          />
        </div>
      </div>
      <NutritionTargetsDialog open={targetsOpen} onOpenChange={setTargetsOpen} />
    </>
  )
}
