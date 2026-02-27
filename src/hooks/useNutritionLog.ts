import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  getLogEntries,
  createLogEntry,
  updateLogEntry,
  deleteLogEntry,
  getTargets,
  upsertTargets,
} from '@/services/nutritionLog'
import { useAuthStore } from '@/stores/authStore'
import type {
  NutritionLogEntry,
  NutritionLogEntryInsert,
  NutritionTargets,
  DailyMacroSummary,
} from '@/types/nutritionLog'
import type { FoodSearchResult } from '@/types/food'

export function scaleNutrients(food: FoodSearchResult, quantity: number) {
  const grams = quantity * (food.servingSize ?? 100)
  return {
    calories: (grams / 100) * (food.nutrients.calories ?? 0),
    protein_g: (grams / 100) * (food.nutrients.protein_g ?? 0),
    carbs_g: (grams / 100) * (food.nutrients.carbs_g ?? 0),
    fat_g: (grams / 100) * (food.nutrients.fat_g ?? 0),
  }
}

export function useNutritionLog(date: Date) {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<NutritionLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateStr = format(date, 'yyyy-MM-dd')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await getLogEntries(user.id, dateStr)
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }, [user, dateStr])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addEntry = useCallback(
    async (entry: Omit<NutritionLogEntryInsert, 'user_id' | 'date'>) => {
      if (!user) return
      const created = await createLogEntry({
        ...entry,
        user_id: user.id,
        date: dateStr,
      })
      setEntries((prev) => [...prev, created])
    },
    [user, dateStr]
  )

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'unit' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>>
    ) => {
      const updated = await updateLogEntry(id, updates)
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
    },
    []
  )

  const deleteEntry = useCallback(async (id: string) => {
    await deleteLogEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const dailySummary: DailyMacroSummary = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein_g: acc.protein_g + (e.protein_g ?? 0),
      carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
      fat_g: acc.fat_g + (e.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  return { entries, loading, error, addEntry, updateEntry, deleteEntry, dailySummary, refresh }
}

export function useNutritionTargets() {
  const { user } = useAuthStore()
  const [targets, setTargets] = useState<NutritionTargets | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getTargets(user.id)
      .then(setTargets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const saveTargets = useCallback(
    async (newTargets: NutritionTargets) => {
      if (!user) return
      await upsertTargets(user.id, newTargets)
      setTargets(newTargets)
    },
    [user]
  )

  return { targets, loading, saveTargets }
}
