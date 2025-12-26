import { Link } from 'react-router-dom'
import { BookOpen, ChefHat, Sparkles, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

const features = [
  {
    icon: ChefHat,
    title: 'Digital Recipe Repository',
    description: 'Consolidate recipes from printed documents, PDFs, social media, and more into one searchable database.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Parsing',
    description: 'Automatically parse ingredients and instructions from free-form text into structured data.',
  },
  {
    icon: Utensils,
    title: 'Nutritional Tracking',
    description: 'Auto-calculate macros and nutritional information for every recipe.',
  },
  {
    icon: BookOpen,
    title: 'Cookbook Organization',
    description: 'Organize your recipes into cookbooks. Keep them private or share with others.',
  },
]

export function Home() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Your Digital Recipe Vault
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Consolidate scattered recipes from printed documents, PDFs, social media posts,
          and other sources into a centralized, searchable database with nutritional tracking.
        </p>
        <div className="flex justify-center gap-4">
          {user ? (
            <>
              <Button size="lg" asChild>
                <Link to="/recipes/new">Create Recipe</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Features
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary-600 mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
