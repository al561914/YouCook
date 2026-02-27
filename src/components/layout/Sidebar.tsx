import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { BookOpen, ChefHat, Database, Home, Settings, X, ChevronDown, ChevronRight, Plus, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useCookbooks } from '@/hooks/useCookbooks'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: ChefHat, requiresAuth: true },
  { name: 'Cookbooks', href: '/cookbooks', icon: BookOpen, requiresAuth: true },
  { name: 'Food Database', href: '/foods', icon: Database },
  { name: 'Nutrition Log', href: '/nutrition-log', icon: UtensilsCrossed, requiresAuth: true },
  { name: 'Settings', href: '/settings', icon: Settings, requiresAuth: true },
]

export function Sidebar() {
  const location = useLocation()
  const params = useParams()
  const { sidebarOpen, closeSidebar } = useUIStore()
  const { user } = useAuthStore()
  const { cookbooks, loading: cookbooksLoading } = useCookbooks()
  const [cookbooksExpanded, setCookbooksExpanded] = useState(true)

  const filteredNavigation = navigation.filter(
    (item) => !item.requiresAuth || user
  )

  // Determine active cookbook ID from route
  const activeCookbookId = location.pathname.startsWith('/cookbooks/') ? params.id : null

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 md:hidden">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Main Navigation */}
            <div className="space-y-1 mb-4">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Cookbooks Section - Only show for authenticated users */}
            {user && (
              <>
                <div className="border-t border-gray-200 mb-4" />

                <Collapsible open={cookbooksExpanded} onOpenChange={setCookbooksExpanded}>
                  <div className="mb-2">
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          My Cookbooks
                        </span>
                        {cookbooksExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-1">
                    {cookbooksLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : cookbooks.length === 0 ? (
                      <div className="px-3 py-2">
                        <p className="text-xs text-gray-500 mb-2">No cookbooks yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link to="/cookbooks" onClick={closeSidebar}>
                            <Plus className="h-3 w-3 mr-1" />
                            Create Cookbook
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        {cookbooks.map((cookbook) => {
                          const isActiveCookbook = activeCookbookId === cookbook.id
                          const recipeCount = (cookbook as { recipe_count?: number }).recipe_count || 0

                          return (
                            <Link
                              key={cookbook.id}
                              to={`/cookbooks/${cookbook.id}`}
                              onClick={closeSidebar}
                              className={cn(
                                'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors group',
                                isActiveCookbook
                                  ? 'bg-blue-50 text-blue-900 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <span className="truncate flex-1">{cookbook.name}</span>
                              {recipeCount > 0 && (
                                <span
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    isActiveCookbook
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                  )}
                                >
                                  {recipeCount}
                                </span>
                              )}
                            </Link>
                          )
                        })}

                        {/* Quick Actions */}
                        <div className="pt-2 space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-gray-600"
                            asChild
                          >
                            <Link to="/cookbooks" onClick={closeSidebar}>
                              <Plus className="h-3 w-3 mr-2" />
                              New Cookbook
                            </Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">
              RecipeVault v0.1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
