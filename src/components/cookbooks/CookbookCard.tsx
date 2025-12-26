import { Link } from 'react-router-dom'
import { BookOpen, Globe, Lock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Cookbook } from '@/types/cookbook'
import { formatDistanceToNow } from 'date-fns'

interface CookbookCardProps {
  cookbook: Cookbook
  recipeCount?: number
  onEdit?: (cookbook: Cookbook) => void
  onDelete?: (cookbook: Cookbook) => void
}

export function CookbookCard({ cookbook, recipeCount = 0, onEdit, onDelete }: CookbookCardProps) {
  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <Link to={`/cookbooks/${cookbook.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary-100 p-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{cookbook.name}</CardTitle>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  {cookbook.is_public ? (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cookbook.description && (
            <CardDescription className="line-clamp-2 mb-3">
              {cookbook.description}
            </CardDescription>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</span>
            <span>Updated {formatDistanceToNow(new Date(cookbook.updated_at), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Link>

      {/* Actions dropdown */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault()
              onEdit?.(cookbook)
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.preventDefault()
                onDelete?.(cookbook)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
