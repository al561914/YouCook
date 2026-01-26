import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialInput } from './SocialInput'
import { ImportPreview } from './ImportPreview'
import { extractSocialRecipe, validateSocialUrl, type SocialExtractionResult } from '@/services/import/socialExtractor'

interface SocialImporterProps {
  onComplete: (recipe: any) => void
  onCancel: () => void
}

type Step = 'input' | 'extracting' | 'preview'

export function SocialImporter({ onComplete, onCancel }: SocialImporterProps) {
  const [step, setStep] = useState<Step>('input')
  const [url, setUrl] = useState('')
  const [extractedRecipe, setExtractedRecipe] = useState<SocialExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    // Validate URL first
    const validation = validateSocialUrl(url)
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL')
      return
    }

    setStep('extracting')
    setError(null)

    try {
      const result = await extractSocialRecipe(url)
      setExtractedRecipe(result)
      setStep('preview')
    } catch (err) {
      console.error('Error extracting social recipe:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract recipe')
      setStep('input')
    }
  }

  const handleConfirm = () => {
    if (extractedRecipe) {
      // Pass the full result including source_url, thumbnail data, and import_metadata
      onComplete({
        title: extractedRecipe.title,
        description: extractedRecipe.description,
        servings: extractedRecipe.servings,
        prep_time_minutes: extractedRecipe.prep_time_minutes,
        cook_time_minutes: extractedRecipe.cook_time_minutes,
        raw_ingredients_text: extractedRecipe.raw_ingredients_text,
        raw_procedure_text: extractedRecipe.raw_procedure_text,
        extraction_confidence: extractedRecipe.extraction_confidence,
        warnings: extractedRecipe.warnings,
        source_url: extractedRecipe.source_url,
        thumbnail_url: extractedRecipe.thumbnail_url,
        thumbnail_base64: extractedRecipe.thumbnail_base64,
        thumbnail_mime_type: extractedRecipe.thumbnail_mime_type,
        import_metadata: extractedRecipe.import_metadata,
      })
    }
  }

  const handleEdit = () => {
    // Same as confirm - the edit will happen in the recipe form
    handleConfirm()
  }

  const handleBack = () => {
    setStep('input')
    setExtractedRecipe(null)
    setError(null)
  }

  return (
    <div className="space-y-6 py-4">
      {/* Input Step */}
      {step === 'input' && (
        <>
          <div>
            <h3 className="text-lg font-medium mb-2">Import from Instagram</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste a link to an Instagram post or reel containing a recipe. We'll extract the recipe from the caption.
            </p>
          </div>

          <SocialInput
            value={url}
            onChange={setUrl}
            disabled={false}
            error={error}
          />

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleExtract} disabled={!url.trim()}>
              Extract Recipe
            </Button>
          </div>
        </>
      )}

      {/* Extracting Step */}
      {step === 'extracting' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Extracting recipe...</h3>
          <p className="text-sm text-gray-500 mt-2">
            Fetching post and analyzing the caption
          </p>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && extractedRecipe && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h3 className="text-lg font-medium">Review Extracted Recipe</h3>
          </div>

          <ImportPreview
            title={extractedRecipe.title}
            description={extractedRecipe.description}
            servings={extractedRecipe.servings}
            prepTimeMinutes={extractedRecipe.prep_time_minutes}
            cookTimeMinutes={extractedRecipe.cook_time_minutes}
            ingredientsPreview={extractedRecipe.raw_ingredients_text.split('\n').slice(0, 5).join('\n')}
            instructionsPreview={extractedRecipe.raw_procedure_text.split('\n').slice(0, 3).join('\n')}
            confidence={extractedRecipe.extraction_confidence}
            warnings={extractedRecipe.warnings}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onCancel={handleBack}
            loading={false}
            sourceUrl={extractedRecipe.source_url}
            thumbnailUrl={extractedRecipe.thumbnail_url}
            thumbnailBase64={extractedRecipe.thumbnail_base64}
            thumbnailMimeType={extractedRecipe.thumbnail_mime_type}
            author={extractedRecipe.import_metadata.author}
          />
        </>
      )}
    </div>
  )
}
