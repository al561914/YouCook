import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { PDFDropzone } from './PDFDropzone'
import { PDFPageSelector } from './PDFPageSelector'
import { ImportPreview } from './ImportPreview'
import { extractPDF, type PDFPageImage } from '@/services/import'
import { supabase } from '@/services/supabase'

type Step = 'upload' | 'select-pages' | 'extracting' | 'preview'

interface ExtractedRecipe {
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

interface PDFImporterProps {
  onComplete: (recipe: ExtractedRecipe) => void
  onCancel: () => void
}

export function PDFImporter({ onComplete, onCancel }: PDFImporterProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PDFPageImage[]>([])
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<number[]>([])
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setStep('extracting')

    try {
      // Extract PDF pages
      const extraction = await extractPDF(selectedFile)
      setPages(extraction.pages)
      setSelectedPageNumbers(extraction.pages.map((p) => p.pageNumber))

      // Move to page selection
      setStep('select-pages')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF')
      setStep('upload')
    }
  }, [])

  const handleExtract = useCallback(async () => {
    if (!file || selectedPageNumbers.length === 0) return

    setStep('extracting')
    setError(null)

    try {
      // Get selected pages
      const selectedPages = pages.filter((p) => selectedPageNumbers.includes(p.pageNumber))

      // Also get text content for all selected pages
      const extraction = await extractPDF(file)
      const textContent = extraction.textContent

      // Call Edge Function to extract recipe
      const { data, error } = await supabase.functions.invoke('extract-pdf-recipe', {
        body: {
          pages: selectedPages,
          textContent,
        },
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error)
      }

      setExtractedRecipe(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract recipe')
      setStep('select-pages')
    }
  }, [file, pages, selectedPageNumbers])

  const handleConfirm = () => {
    if (extractedRecipe) {
      onComplete(extractedRecipe)
    }
  }

  const handleEdit = () => {
    if (extractedRecipe) {
      // Navigate to edit mode with pre-filled data
      onComplete(extractedRecipe)
    }
  }

  const handleBack = () => {
    if (step === 'select-pages') {
      setStep('upload')
      setFile(null)
      setPages([])
      setSelectedPageNumbers([])
    } else if (step === 'preview') {
      setStep('select-pages')
      setExtractedRecipe(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step: Upload */}
      {step === 'upload' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload PDF Recipe</h2>
          <PDFDropzone onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* Step: Select Pages */}
      {step === 'select-pages' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Pages</h2>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          </div>
          <PDFPageSelector
            pages={pages}
            onSelectionChange={setSelectedPageNumbers}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExtract}
              disabled={selectedPageNumbers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Extract Recipe
            </button>
          </div>
        </div>
      )}

      {/* Step: Extracting */}
      {step === 'extracting' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-900">Processing PDF...</p>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'extracting' && file ? 'Extracting recipe from selected pages' : 'Reading PDF pages'}
          </p>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && extractedRecipe && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Review Extracted Recipe</h2>
            <button
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
          <ImportPreview
            title={extractedRecipe.title}
            description={extractedRecipe.description}
            servings={extractedRecipe.servings}
            prepTimeMinutes={extractedRecipe.prep_time_minutes}
            cookTimeMinutes={extractedRecipe.cook_time_minutes}
            ingredientsPreview={extractedRecipe.raw_ingredients_text}
            instructionsPreview={extractedRecipe.raw_procedure_text}
            confidence={extractedRecipe.extraction_confidence}
            warnings={extractedRecipe.warnings}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onCancel={onCancel}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
