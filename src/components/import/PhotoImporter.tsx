import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoDropzone } from './PhotoDropzone'
import { ImportPreview } from './ImportPreview'
import { extractPhoto } from '@/services/import'
import { supabase } from '@/services/supabase'

interface PhotoImporterProps {
  onComplete: (recipe: any) => void
  onCancel: () => void
}

type Step = 'upload' | 'extracting' | 'preview'

interface ExtractionResult {
  title: string
  description: string | null
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  raw_ingredients_text: string
  raw_procedure_text: string
  extraction_confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

export function PhotoImporter({ onComplete, onCancel }: PhotoImporterProps) {
  const [step, setStep] = useState<Step>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
  }

  const handleExtract = async () => {
    if (!selectedFile) return

    setStep('extracting')
    setError(null)

    try {
      // Extract photo to base64
      const { image, fileName } = await extractPhoto(selectedFile)

      // Call Edge Function to extract recipe
      const { data, error: functionError } = await supabase.functions.invoke('extract-photo-recipe', {
        body: {
          image: {
            imageBase64: image.imageBase64,
            width: image.width,
            height: image.height,
            mimeType: image.mimeType,
          },
          fileName,
        },
      })

      if (functionError) {
        throw new Error(functionError.message || 'Failed to extract recipe from photo')
      }

      if (!data) {
        throw new Error('No data returned from extraction')
      }

      setExtractedRecipe(data)
      setStep('preview')
    } catch (err) {
      console.error('Error extracting photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract recipe from photo')
      setStep('upload')
    }
  }

  const handleConfirm = () => {
    if (extractedRecipe) {
      onComplete(extractedRecipe)
    }
  }

  const handleEdit = () => {
    if (extractedRecipe) {
      onComplete(extractedRecipe)
    }
  }

  const handleBack = () => {
    setStep('upload')
    setSelectedFile(null)
    setExtractedRecipe(null)
    setError(null)
  }

  return (
    <div className="space-y-6 py-4">
      {/* Upload Step */}
      {step === 'upload' && (
        <>
          <div>
            <h3 className="text-lg font-medium mb-2">Upload Recipe Photo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Take a photo of a recipe or upload an existing image. Our AI will extract the recipe details.
            </p>
          </div>

          <PhotoDropzone
            onFileSelect={handleFileSelect}
            disabled={false}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleExtract} disabled={!selectedFile}>
              Extract Recipe
            </Button>
          </div>
        </>
      )}

      {/* Extracting Step */}
      {step === 'extracting' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Extracting recipe...</h3>
          <p className="text-sm text-gray-500 mt-2">
            Using AI to read the recipe from your photo
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
          />
        </>
      )}
    </div>
  )
}
