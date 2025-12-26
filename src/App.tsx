import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { ErrorBoundary } from '@/components/common'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Home,
  Login,
  Register,
  Dashboard,
  RecipeNew,
  RecipeEdit,
  RecipeView,
  CookMode,
  CookbookList,
  CookbookView,
  FoodDatabase,
  Settings,
} from '@/pages'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/foods" element={<FoodDatabase />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/new"
              element={
                <ProtectedRoute>
                  <RecipeNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:id"
              element={
                <ProtectedRoute>
                  <RecipeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:id/edit"
              element={
                <ProtectedRoute>
                  <RecipeEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:id/cook"
              element={
                <ProtectedRoute>
                  <CookMode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cookbooks"
              element={
                <ProtectedRoute>
                  <CookbookList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cookbooks/:id"
              element={
                <ProtectedRoute>
                  <CookbookView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
