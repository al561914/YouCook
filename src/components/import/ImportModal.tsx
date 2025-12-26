import { useState } from 'react'
import { FileText, Image, Link as LinkIcon, Share2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PDFImporter } from './PDFImporter'

type ImportMethod = 'pdf' | 'photo' | 'url' | 'social' | null

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onRecipeExtracted: (recipe: any) => void
}

export function ImportModal({ open, onClose, onRecipeExtracted }: ImportModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>(null)

  const handleMethodSelect = (method: ImportMethod) => {
    setSelectedMethod(method)
  }

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const handleComplete = (recipe: any) => {
    onRecipeExtracted(recipe)
    onClose()
  }

  const handleCancel = () => {
    setSelectedMethod(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {selectedMethod ? 'Import Recipe' : 'Add Recipe'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        {!selectedMethod ? (
          /* Method selection */
          <div className="space-y-6 py-4">
            <div>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-auto py-4 justify-start"
                onClick={handleCancel}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Manual Entry</p>
                    <p className="text-sm text-gray-500">Create recipe from scratch</p>
                  </div>
                </div>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or import from</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4"
                onClick={() => handleMethodSelect('pdf')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="font-medium">PDF</p>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4"
                onClick={() => handleMethodSelect('photo')}
                disabled
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Image className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium">Photo</p>
                  <span className="text-xs text-gray-500">Coming soon</span>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4"
                onClick={() => handleMethodSelect('url')}
                disabled
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <LinkIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium">URL</p>
                  <span className="text-xs text-gray-500">Coming soon</span>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4"
                onClick={() => handleMethodSelect('social')}
                disabled
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="font-medium">Social</p>
                  <span className="text-xs text-gray-500">Coming soon</span>
                </div>
              </Button>
            </div>
          </div>
        ) : selectedMethod === 'pdf' ? (
          /* PDF Importer */
          <PDFImporter onComplete={handleComplete} onCancel={handleBack} />
        ) : (
          /* Placeholder for other methods */
          <div className="py-8 text-center text-gray-500">
            <p>This import method is not yet available</p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
