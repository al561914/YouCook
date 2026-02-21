import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChefHat, Globe, Lock, Plus, LayoutGrid, List, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { TagBadge } from '@/components/recipes/TagBadge'
import { useCookbook } from '@/hooks/useCookbooks'
import { DIFFICULTY_LABELS } from '@/lib/constants'
import type { CookbookWithRecipes } from '@/types/cookbook'

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'alphabetical' | 'difficulty' | 'time'

export function CookbookView() {
  const { id } = useParams<{ id: string }>()
  const { cookbook, loading, error } = useCookbook(id)

  // View controls
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('')

  // Extract recipes (safe to do before early returns)
  const cookbookWithRecipes = cookbook as CookbookWithRecipes | null
  const allRecipes = cookbookWithRecipes?.recipes || []

  // Collect all unique tags across recipes for the filter dropdown
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    allRecipes.forEach((recipe) => {
      const tags = (recipe as any).tags as string[] | undefined
      tags?.forEach((t) => tagSet.add(t))
    })
    return Array.from(tagSet).sort()
  }, [allRecipes])

  // Filter and sort recipes (must be called before early returns)
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = allRecipes

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query)
      )
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((recipe) => recipe.difficulty === filterDifficulty)
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter((recipe) => {
        const tags = (recipe as any).tags as string[] | undefined
        return tags?.includes(filterTag)
      })
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'difficulty':
        const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 }
        sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
        break
      case 'time':
        sorted.sort((a, b) => {
          const timeA = (a.prep_time_minutes || 0) + (a.cook_time_minutes || 0)
          const timeB = (b.prep_time_minutes || 0) + (b.cook_time_minutes || 0)
          return timeA - timeB
        })
        break
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return sorted
  }, [allRecipes, searchQuery, filterDifficulty, sortBy])

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !cookbook) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/cookbooks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cookbooks
          </Link>
        </Button>
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error || 'Cookbook not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cookbooks">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">{cookbook.name}</h1>
            {cookbook.is_public ? (
              <Globe className="h-5 w-5 text-gray-400" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
          </div>
          {cookbook.description && (
            <p className="mt-1 text-gray-600">{cookbook.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {allRecipes.length} {allRecipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
        <Button asChild>
          <Link to={`/recipes/new?cookbook=${cookbook.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recipe
          </Link>
        </Button>
      </div>

      {/* Controls - Only show if there are recipes */}
      {allRecipes.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tag Filter */}
            {availableTags.length > 0 && (
              <Select value={filterTag || 'all'} onValueChange={(v) => setFilterTag(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Difficulty Filter */}
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="time">Cook Time</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty States */}
      {allRecipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No recipes yet</h3>
            <p className="text-gray-500 mt-1 mb-4 max-w-md">
              Start building your collection by adding your first recipe. You can create recipes from scratch or import them from the web.
            </p>
            <Button asChild>
              <Link to={`/recipes/new?cookbook=${cookbook.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recipe
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredAndSortedRecipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <SearchIcon className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No recipes found</h3>
            <p className="text-gray-500 mt-1 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setFilterDifficulty('all')
                setFilterTag('')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedRecipes.map((recipe) => {
            const thumbnailUrl = (recipe as any).thumbnail_url as string | undefined
            const recipeTags = (recipe as any).tags as string[] | undefined
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
            return (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <Link to={`/recipes/${recipe.id}`}>
                  {thumbnailUrl ? (
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={thumbnailUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{recipe.title}</h3>
                    {recipe.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    {recipeTags && recipeTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {recipeTags.slice(0, 3).map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        {recipeTags.length > 3 && (
                          <span className="text-xs text-gray-400">+{recipeTags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize">{DIFFICULTY_LABELS[recipe.difficulty]}</span>
                      {totalTime > 0 && <span>{totalTime} min</span>}
                      {recipe.servings && <span>{recipe.servings} servings</span>}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredAndSortedRecipes.map((recipe) => {
            const thumbnailUrl = (recipe as any).thumbnail_url as string | undefined
            const recipeTags = (recipe as any).tags as string[] | undefined
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
            return (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                <Link to={`/recipes/${recipe.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {thumbnailUrl ? (
                        <div className="w-24 h-24 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                          <img
                            src={thumbnailUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 flex-shrink-0 rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ChefHat className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                        {recipe.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                        {recipeTags && recipeTags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {recipeTags.slice(0, 4).map((tag) => (
                              <TagBadge key={tag} tag={tag} />
                            ))}
                            {recipeTags.length > 4 && (
                              <span className="text-xs text-gray-400">+{recipeTags.length - 4}</span>
                            )}
                          </div>
                        )}
                        <div className="mt-1.5 flex items-center gap-4 text-xs text-gray-500">
                          <span className="capitalize">{DIFFICULTY_LABELS[recipe.difficulty]}</span>
                          {totalTime > 0 && <span>{totalTime} min total</span>}
                          {recipe.servings && <span>{recipe.servings} servings</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
