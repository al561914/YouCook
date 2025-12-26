import { Link } from 'react-router-dom'
import { BookOpen, ChefHat, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { useCookbooks } from '@/hooks/useCookbooks'
import { useRecentRecipes, useRecipeStats } from '@/hooks/useRecipes'
import { DIFFICULTY_LABELS } from '@/lib/constants'

export function Dashboard() {
  const { user } = useAuthStore()
  const { cookbooks, loading: cookbooksLoading } = useCookbooks()
  const { recipes: recentRecipes, loading: recipesLoading } = useRecentRecipes(5)
  const { stats, loading: statsLoading } = useRecipeStats()

  const loading = cookbooksLoading || recipesLoading || statsLoading

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user?.user_metadata?.display_name ? ", " + user.user_metadata.display_name : ''}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your recipe collection.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link to="/recipes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/cookbooks">
            <BookOpen className="mr-2 h-4 w-4" />
            My Cookbooks
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.recipeCount}</div>
                <p className="text-xs text-gray-500">
                  {stats.recipeCount === 0 ? 'No recipes yet' : 'recipes in your collection'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cookbooks</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{cookbooks.length}</div>
                <p className="text-xs text-gray-500">
                  {cookbooks.length === 0 ? 'Create your first cookbook' : 'to organize your recipes'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foods Matched</CardTitle>
            <ChefHat className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-gray-500">Nutrition matching coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Recipes</CardTitle>
          <CardDescription>Your most recently created or edited recipes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChefHat className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No recipes yet</h3>
              <p className="text-gray-500 mt-1 mb-4">Get started by creating your first recipe</p>
              <Button asChild>
                <Link to="/recipes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Recipe
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={"/recipes/" + recipe.id}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                      {recipe.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{recipe.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{DIFFICULTY_LABELS[recipe.difficulty]}</span>
                      {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
