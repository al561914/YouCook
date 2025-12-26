import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import * as cookbookService from '@/services/cookbooks'
import type { Cookbook } from '@/types/cookbook'
import type { CookbookFormData } from '@/lib/validators'

export function useCookbooks() {
  const { user } = useAuthStore()
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCookbooks = useCallback(async () => {
    if (!user) {
      setCookbooks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await cookbookService.getCookbooks(user.id)
      setCookbooks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cookbooks')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCookbooks()
  }, [fetchCookbooks])

  const createCookbook = async (data: CookbookFormData): Promise<Cookbook> => {
    if (!user) throw new Error('Not authenticated')

    const cookbook = await cookbookService.createCookbook({
      user_id: user.id,
      name: data.name,
      description: data.description || null,
      is_public: data.isPublic,
    })

    setCookbooks((prev) => [cookbook, ...prev])
    return cookbook
  }

  const updateCookbook = async (id: string, data: CookbookFormData): Promise<Cookbook> => {
    const cookbook = await cookbookService.updateCookbook(id, {
      name: data.name,
      description: data.description || null,
      is_public: data.isPublic,
    })

    setCookbooks((prev) =>
      prev.map((c) => (c.id === id ? cookbook : c))
    )
    return cookbook
  }

  const deleteCookbook = async (id: string): Promise<void> => {
    await cookbookService.deleteCookbook(id)
    setCookbooks((prev) => prev.filter((c) => c.id !== id))
  }

  return {
    cookbooks,
    loading,
    error,
    refresh: fetchCookbooks,
    createCookbook,
    updateCookbook,
    deleteCookbook,
  }
}

export function useCookbook(cookbookId: string | undefined) {
  const [cookbook, setCookbook] = useState<Cookbook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cookbookId) {
      setCookbook(null)
      setLoading(false)
      return
    }

    const fetchCookbook = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await cookbookService.getCookbookWithRecipes(cookbookId)
        setCookbook(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cookbook')
      } finally {
        setLoading(false)
      }
    }

    fetchCookbook()
  }, [cookbookId])

  return { cookbook, loading, error }
}
