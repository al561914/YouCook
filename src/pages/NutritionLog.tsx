import { useState } from 'react'
import { format, addDays, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DailyMacroSummary, MealSection } from '@/components/nutrition'
import { useNutritionLog } from '@/hooks/useNutritionLog'
import { MEAL_NAMES } from '@/lib/constants'

export function NutritionLog() {
  const [date, setDate] = useState(new Date())
  const { entries, loading, error, addEntry, updateEntry, deleteEntry, dailySummary } =
    useNutritionLog(date)

  const prev = () => setDate((d) => addDays(d, -1))
  const next = () => setDate((d) => addDays(d, 1))
  const today = () => setDate(new Date())

  const entriesForMeal = (mealName: string) =>
    entries.filter((e) => e.meal_name === mealName)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {format(date, 'EEE, MMM d, yyyy')}
          </h1>
          {!isToday(date) && (
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={next}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      {/* Daily macro summary */}
      <DailyMacroSummary summary={dailySummary} />

      {/* Meal sections */}
      {loading ? (
        <div className="space-y-3">
          {MEAL_NAMES.map((name) => (
            <div key={name} className="bg-white rounded-lg border border-gray-200 h-14 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {MEAL_NAMES.map((mealName) => (
            <MealSection
              key={mealName}
              mealName={mealName}
              entries={entriesForMeal(mealName)}
              date={date}
              onEntryAdded={addEntry}
              onEntryDeleted={deleteEntry}
              onEntryUpdated={updateEntry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
