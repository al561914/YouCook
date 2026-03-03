import { useState, useEffect } from 'react'
import { Database, Plus, Search, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FoodList, CustomFoodForm, BarcodeScanner, type CustomFoodFormData } from '@/components/foods'
import { ConfirmDialog } from '@/components/common'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import * as foodService from '@/services/foods'
import type { FoodSearchResult, FoodWithNutrients } from '@/types/food'

export function FoodDatabase() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [searchSource, setSearchSource] = useState<'local' | 'api' | 'combined' | null>(null)
  const [myFoods, setMyFoods] = useState<FoodWithNutrients[]>([])
  const [loadingMyFoods, setLoadingMyFoods] = useState(false)
  const [customFoodFormOpen, setCustomFoodFormOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodWithNutrients | null>(null)
  const [deletingFood, setDeletingFood] = useState<FoodWithNutrients | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Load user's custom foods on mount
  useEffect(() => {
    loadMyFoods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadMyFoods = async () => {
    if (!user) return

    setLoadingMyFoods(true)
    try {
      const foods = await foodService.getUserFoods(user.id)
      setMyFoods(foods)
    } catch (err) {
      console.error('Failed to load custom foods:', err)
    } finally {
      setLoadingMyFoods(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)

    try {
      const result = await foodService.searchFoods(searchQuery.trim(), 20)
      setSearchResults(result.foods)
      setSearchSource(result.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search foods')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleBarcodeScan = async (barcode: string) => {
    setSearchQuery(barcode)
    setSearching(true)
    setError(null)

    try {
      const result = await foodService.searchFoods(barcode, 20)
      setSearchResults(result.foods)
      setSearchSource(result.source)

      if (result.foods.length === 0) {
        toast({
          title: "No product found",
          description: `No product found for barcode ${barcode}. Try searching by name.`,
        })
      } else if (result.foods.length === 1) {
        toast({
          title: "Product found!",
          description: result.foods[0].name,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search barcode')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleCreateFood = () => {
    setEditingFood(null)
    setCustomFoodFormOpen(true)
  }

  const handleEditFood = (food: FoodWithNutrients) => {
    setEditingFood(food)
    setCustomFoodFormOpen(true)
  }

  const handleDeleteFood = (food: FoodWithNutrients) => {
    setDeletingFood(food)
  }

  const handleFormSubmit = async (data: CustomFoodFormData) => {
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      if (editingFood) {
        // Update existing food
        await foodService.updateCustomFood(editingFood.id, user.id, {
          name: data.name,
          brand: data.brand,
          servingSize: data.servingSize,
          servingUnit: data.servingUnit,
          servingDescription: data.servingDescription,
          nutrients: {
            calories: data.calories,
            protein_g: data.protein_g,
            carbs_g: data.carbs_g,
            fat_g: data.fat_g,
            fiber_g: data.fiber_g,
            sugar_g: data.sugar_g,
            sodium_mg: data.sodium_mg,
          },
        })
        toast({
          title: "Food updated!",
          description: `${data.name} has been updated successfully.`,
        })
      } else {
        // Create new food
        await foodService.createCustomFood(user.id, {
          name: data.name,
          brand: data.brand,
          servingSize: data.servingSize,
          servingUnit: data.servingUnit,
          servingDescription: data.servingDescription,
          nutrients: {
            calories: data.calories,
            protein_g: data.protein_g,
            carbs_g: data.carbs_g,
            fat_g: data.fat_g,
            fiber_g: data.fiber_g,
            sugar_g: data.sugar_g,
            sodium_mg: data.sodium_mg,
          },
        })
        toast({
          title: "Custom food created!",
          description: `${data.name} has been added to your database.`,
        })
      }

      setCustomFoodFormOpen(false)
      setEditingFood(null)

      // Refresh my foods list
      loadMyFoods()

      // Refresh search results if there's a query
      if (searchQuery.trim()) {
        const result = await foodService.searchFoods(searchQuery.trim(), 20)
        setSearchResults(result.foods)
        setSearchSource(result.source)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save food'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveFood = async (food: FoodSearchResult) => {
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      await foodService.saveFood(food, user.id)

      // Show success toast
      toast({
        title: "Food saved!",
        description: `${food.name} has been added to your local database.`,
      })

      // Refresh my foods list
      loadMyFoods()

      // Refresh search results to show it's now in local DB
      if (searchQuery.trim()) {
        const result = await foodService.searchFoods(searchQuery.trim(), 20)
        setSearchResults(result.foods)
        setSearchSource(result.source)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save food'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error saving food",
        description: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingFood || !user) return

    setSubmitting(true)
    setError(null)

    try {
      const foodName = deletingFood.name
      await foodService.deleteCustomFood(deletingFood.id, user.id)
      setDeletingFood(null)

      toast({
        title: "Food deleted",
        description: `${foodName} has been removed from your database.`,
      })

      // Refresh my foods list
      loadMyFoods()

      // Refresh search results
      if (searchQuery.trim()) {
        const result = await foodService.searchFoods(searchQuery.trim(), 20)
        setSearchResults(result.foods)
        setSearchSource(result.source)
      } else {
        // Remove from current results
        setSearchResults(prev => prev.filter(f => f.id !== deletingFood.id))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete food'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error deleting food",
        description: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food Database</h1>
          <p className="mt-2 text-gray-600">
            Search and manage foods for nutritional tracking.
          </p>
        </div>
        <Button onClick={handleCreateFood}>
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Food
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Foods</CardTitle>
          <CardDescription>
            Search by name or barcode. Sources: Local database, USDA FoodData Central, and Open Food Facts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or barcode..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={searching || !searchQuery.trim()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerOpen(true)}
              title="Scan barcode with camera"
            >
              <Camera className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Scan</span>
            </Button>
          </form>

          {searching ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found {searchResults.length} results
                  {searchSource && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {searchSource === 'local' ? 'Local Database' :
                       searchSource === 'api' ? 'API Results' : 'Local + API'}
                    </span>
                  )}
                </p>
              </div>
              <FoodList
                foods={searchResults}
                onEdit={handleEditFood}
                onDelete={handleDeleteFood}
                onSave={handleSaveFood}
                showSaveButton={true}
              />
            </div>
          ) : searchQuery && !searching ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No foods found</h3>
              <p className="text-gray-500 mt-1">
                Try a different search term or add a custom food
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Search for foods</h3>
              <p className="text-gray-500 mt-1">
                Enter a search term to find foods and their nutritional information
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Custom Foods Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Custom Foods</CardTitle>
          <CardDescription>
            Foods you've created or saved to your local database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMyFoods ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : myFoods.length > 0 ? (
            <FoodList
              foods={myFoods}
              onEdit={handleEditFood}
              onDelete={handleDeleteFood}
              showSaveButton={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No custom foods yet</h3>
              <p className="text-gray-500 mt-1 mb-4">
                Create custom foods or save foods from search results to see them here
              </p>
              <Button onClick={handleCreateFood} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Food
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomFoodForm
        open={customFoodFormOpen}
        onOpenChange={setCustomFoodFormOpen}
        onSubmit={handleFormSubmit}
        food={editingFood}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!deletingFood}
        onOpenChange={(open) => !open && setDeletingFood(null)}
        title="Delete Custom Food"
        description={`Are you sure you want to delete "${deletingFood?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={submitting}
      />

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </div>
  )
}
