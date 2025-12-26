import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CookbookFormData } from '@/lib/validators'
import type { Cookbook } from '@/types/cookbook'

interface CookbookFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CookbookFormData) => Promise<void>
  cookbook?: Cookbook | null
  loading?: boolean
}

export function CookbookForm({
  open,
  onOpenChange,
  onSubmit,
  cookbook,
  loading = false,
}: CookbookFormProps) {
  const isEditing = !!cookbook

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CookbookFormData>({
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: cookbook?.name ?? '',
        description: cookbook?.description ?? '',
        isPublic: cookbook?.is_public ?? false,
      })
    }
  }, [open, cookbook, reset])

  const handleFormSubmit = async (data: CookbookFormData) => {
    if (!data.name.trim()) return
    await onSubmit(data)
    reset()
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Cookbook' : 'Create Cookbook'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your cookbook details.'
              : 'Create a new cookbook to organize your recipes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Favorite Recipes"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A collection of family recipes..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              className="h-4 w-4 rounded border-gray-300"
              {...register('isPublic')}
            />
            <Label htmlFor="isPublic" className="font-normal">
              Make this cookbook public
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Cookbook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
