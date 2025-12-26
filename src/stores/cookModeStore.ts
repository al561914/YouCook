import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CookModeState {
  recipeId: string | null
  currentStepIndex: number
  totalSteps: number
  isActive: boolean
  checkedIngredients: Set<string>
  servingMultiplier: number
  startedAt: string | null

  // Actions
  startCookMode: (recipeId: string, totalSteps: number) => void
  exitCookMode: () => void
  goToStep: (index: number) => void
  nextStep: () => void
  prevStep: () => void
  toggleIngredient: (id: string) => void
  setServingMultiplier: (multiplier: number) => void
}

export const useCookModeStore = create<CookModeState>()(
  persist(
    (set, get) => ({
      recipeId: null,
      currentStepIndex: 0,
      totalSteps: 0,
      isActive: false,
      checkedIngredients: new Set(),
      servingMultiplier: 1,
      startedAt: null,

      startCookMode: (recipeId, totalSteps) =>
        set({
          recipeId,
          totalSteps,
          currentStepIndex: 0,
          isActive: true,
          startedAt: new Date().toISOString(),
          checkedIngredients: new Set(),
          servingMultiplier: 1,
        }),

      exitCookMode: () =>
        set({
          recipeId: null,
          currentStepIndex: 0,
          totalSteps: 0,
          isActive: false,
          startedAt: null,
          checkedIngredients: new Set(),
          servingMultiplier: 1,
        }),

      goToStep: (index) => {
        const { totalSteps } = get()
        if (index >= 0 && index < totalSteps) {
          set({ currentStepIndex: index })
        }
      },

      nextStep: () => {
        const { currentStepIndex, totalSteps } = get()
        if (currentStepIndex < totalSteps - 1) {
          set({ currentStepIndex: currentStepIndex + 1 })
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get()
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 })
        }
      },

      toggleIngredient: (id) =>
        set((state) => {
          const next = new Set(state.checkedIngredients)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return { checkedIngredients: next }
        }),

      setServingMultiplier: (multiplier) => set({ servingMultiplier: multiplier }),
    }),
    {
      name: 'cook-mode-storage',
      // Serialize Set to Array for storage
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          return {
            state: {
              ...state,
              checkedIngredients: new Set(state.checkedIngredients || []),
            },
          }
        },
        setItem: (name, value) => {
          const { state } = value
          localStorage.setItem(
            name,
            JSON.stringify({
              state: {
                ...state,
                checkedIngredients: Array.from(state.checkedIngredients),
              },
            })
          )
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      // Only persist relevant fields
      partialize: (state) => ({
        recipeId: state.recipeId,
        currentStepIndex: state.currentStepIndex,
        totalSteps: state.totalSteps,
        checkedIngredients: state.checkedIngredients,
        servingMultiplier: state.servingMultiplier,
        startedAt: state.startedAt,
      }),
    }
  )
)
