import { useState, useEffect } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getLogEntries, copyDayEntries } from '@/services/nutritionLog'
import { useAuthStore } from '@/stores/authStore'
import type { NutritionLogEntry } from '@/types/nutritionLog'

interface CopyDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toDate: string           // yyyy-MM-dd of the day being viewed
  hasExistingEntries: boolean
  onCopied: () => void
}

export function CopyDayDialog({ open, onOpenChange, toDate, hasExistingEntries, onCopied }: CopyDayDialogProps) {
  const { user } = useAuthStore()
  const [fromDate, setFromDate] = useState('')
  const [preview, setPreview] = useState<NutritionLogEntry[] | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxDate = format(subDays(parseISO(toDate), 1), 'yyyy-MM-dd')

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setFromDate(maxDate)
      setPreview(null)
      setError(null)
    }
  }, [open, maxDate])

  // Fetch preview when fromDate changes
  useEffect(() => {
    if (!fromDate || !user) return
    setLoadingPreview(true)
    setPreview(null)
    getLogEntries(user.id, fromDate)
      .then(setPreview)
      .catch(() => setPreview([]))
      .finally(() => setLoadingPreview(false))
  }, [fromDate, user])

  const handleCopy = async () => {
    if (!user || !fromDate || !preview?.length) return
    setCopying(true)
    setError(null)
    try {
      await copyDayEntries(user.id, fromDate, toDate, hasExistingEntries)
      onCopied()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy entries')
    } finally {
      setCopying(false)
    }
  }

  // Group preview entries by meal for display
  const byMeal = preview
    ? preview.reduce<Record<string, NutritionLogEntry[]>>((acc, e) => {
        ;(acc[e.meal_name] ??= []).push(e)
        return acc
      }, {})
    : {}

  const totalCal = preview?.reduce((s, e) => s + (e.calories ?? 0), 0) ?? 0
  const hasPreview = preview && preview.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy from a previous day</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600">Select day to copy from</label>
            <input
              type="date"
              max={maxDate}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Preview */}
          {loadingPreview && (
            <p className="text-sm text-gray-500 text-center py-2">Loading…</p>
          )}

          {!loadingPreview && preview && preview.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">No entries logged on that day.</p>
          )}

          {!loadingPreview && hasPreview && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {format(parseISO(fromDate), 'EEE, MMM d')} — {Math.round(totalCal)} kcal total
              </p>
              {Object.entries(byMeal).map(([meal, mealEntries]) => (
                <div key={meal} className="flex justify-between text-sm">
                  <span className="text-gray-700">{meal}</span>
                  <span className="text-gray-500">{mealEntries.length} item{mealEntries.length !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Replace warning */}
          {hasExistingEntries && hasPreview && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Today already has entries. Copying will replace all of them.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={copying}>
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={copying || !hasPreview || loadingPreview}
              variant={hasExistingEntries ? 'destructive' : 'default'}
            >
              {copying
                ? 'Copying…'
                : hasExistingEntries
                ? `Replace with ${preview?.length} entries`
                : `Copy ${preview?.length} entries`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
