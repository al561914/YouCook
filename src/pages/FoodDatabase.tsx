import { Database, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function FoodDatabase() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food Database</h1>
          <p className="mt-2 text-gray-600">
            Search and manage foods for nutritional tracking.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Food
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Foods</CardTitle>
          <CardDescription>
            Search from local database, USDA, and Open Food Facts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search for a food..."
                className="pl-9"
              />
            </div>
            <Button>Search</Button>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Search for foods</h3>
            <p className="text-gray-500 mt-1">
              Enter a search term to find foods and their nutritional information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
