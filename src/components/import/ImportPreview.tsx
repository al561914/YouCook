import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ImportPreviewProps {
  title: string
  description: string | null
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  ingredientsPreview: string
  instructionsPreview: string
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  onConfirm: () => void
  onEdit: () => void
  onCancel: () => void
  loading?: boolean
}

export function ImportPreview({
  title,
  description,
  servings,
  prepTimeMinutes,
  cookTimeMinutes,
  ingredientsPreview,
  instructionsPreview,
  confidence,
  warnings,
  onConfirm,
  onEdit,
  onCancel,
  loading,
}: ImportPreviewProps) {
  const confidenceConfig = {
    high: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'High Confidence' },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle, label: 'Medium Confidence' },
    low: { color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle, label: 'Low Confidence' },
  }

  const config = confidenceConfig[confidence]
  const ConfidenceIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-gray-600">{description}</p>
          )}
        </div>
        <Badge variant="outline" className={config.color}>
          <ConfidenceIcon className="h-4 w-4 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{servings}</p>
              <p className="text-sm text-gray-500">Servings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {prepTimeMinutes ? `${prepTimeMinutes}m` : '—'}
              </p>
              <p className="text-sm text-gray-500">Prep Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {cookTimeMinutes ? `${cookTimeMinutes}m` : '—'}
              </p>
              <p className="text-sm text-gray-500">Cook Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingredients preview */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-3 rounded-md">
              {ingredientsPreview || 'No ingredients extracted'}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Instructions preview */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-3 rounded-md">
              {instructionsPreview || 'No instructions extracted'}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="outline" onClick={onEdit} disabled={loading}>
          Edit Before Saving
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          {loading ? 'Saving...' : 'Save Recipe'}
        </Button>
      </div>
    </div>
  )
}
