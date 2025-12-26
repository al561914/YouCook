import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CookbookCard, CookbookForm } from '@/components/cookbooks'
import { ConfirmDialog } from '@/components/common'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useCookbooks } from '@/hooks/useCookbooks'
import type { Cookbook } from '@/types/cookbook'
import type { CookbookFormData } from '@/lib/validators'

export function CookbookList() {
  const { cookbooks, loading, error, createCookbook, updateCookbook, deleteCookbook } = useCookbooks()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCookbook, setEditingCookbook] = useState<Cookbook | null>(null)
  const [deletingCookbook, setDeletingCookbook] = useState<Cookbook | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setEditingCookbook(null)
    setFormOpen(true)
  }

  const handleEdit = (cookbook: Cookbook) => {
    setEditingCookbook(cookbook)
    setFormOpen(true)
  }

  const handleDelete = (cookbook: Cookbook) => {
    setDeletingCookbook(cookbook)
  }

  const handleFormSubmit = async (data: CookbookFormData) => {
    setSubmitting(true)
    try {
      if (editingCookbook) {
        await updateCookbook(editingCookbook.id, data)
      } else {
        await createCookbook(data)
      }
      setFormOpen(false)
      setEditingCookbook(null)
    } catch (err) {
      console.error('Failed to save cookbook:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCookbook) return

    setSubmitting(true)
    try {
      await deleteCookbook(deletingCookbook.id)
      setDeletingCookbook(null)
    } catch (err) {
      console.error('Failed to delete cookbook:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Cookbooks</h1>
          <p className="mt-2 text-gray-600">
            Organize your recipes into cookbooks.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Cookbook
        </Button>
      </div>

      {cookbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-white">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No cookbooks yet</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Create your first cookbook to start organizing recipes
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Cookbook
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cookbooks.map((cookbook) => (
            <CookbookCard
              key={cookbook.id}
              cookbook={cookbook}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CookbookForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        cookbook={editingCookbook}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!deletingCookbook}
        onOpenChange={(open) => !open && setDeletingCookbook(null)}
        title="Delete Cookbook"
        description={`Are you sure you want to delete "${deletingCookbook?.name}"? This will also delete all recipes in this cookbook. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={submitting}
      />
    </div>
  )
}
